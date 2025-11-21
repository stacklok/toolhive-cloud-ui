import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AnySchema } from "ajv";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { JSONSchemaFaker as jsf } from "json-schema-faker";
import type { RequestHandler } from "msw";
import { HttpResponse, http } from "msw";
import { buildMockModule } from "./mockTemplate";

// ===== Config =====
// Adjust the path of the OpenAPI JSON here if needed.
// This repo keeps it at project root as `swagger.json`.

// Strip these noisy prefixes from generated fixture folder names.
const PREFIXES_TO_STRIP = ["api_v1beta_", "api_v0_"];

// ===== Runtime setup =====
// Resolve module directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_PATH = path.join(__dirname, "fixtures");
const FIXTURE_EXT = "ts";

// Load OpenAPI JSON (resolveJsonModule is enabled in tsconfig)
import openapi from "../../swagger.json";

// Ajv configuration
const ajv = new Ajv({ strict: true });
addFormats(ajv);
// Allow vendor/annotation keywords present in OpenAPI-derived schemas
ajv.addKeyword("x-enum-varnames");
ajv.addKeyword("example");

// json-schema-faker options
jsf.option({ alwaysFakeOptionals: true });
jsf.option({ fillProperties: true });
jsf.option({ minItems: 1 });
jsf.option({ maxItems: 3 });
jsf.option({ failOnInvalidTypes: false });
jsf.option({ failOnInvalidFormat: false });

// Prefer example/default values when present to get recognizable data
type JsfOptionCarrier = {
  option: (opts: {
    useExamplesValue?: boolean;
    useDefaultValue?: boolean;
  }) => unknown;
};
try {
  (jsf as unknown as JsfOptionCarrier).option({ useExamplesValue: true });
  (jsf as unknown as JsfOptionCarrier).option({ useDefaultValue: true });
} catch {
  // ignore if not supported by the installed jsf version
}

function toFileSafe(s: string): string {
  return s.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function stripPrefixes(s: string): string {
  let out = s;
  for (const p of PREFIXES_TO_STRIP) {
    out = out
      .replace(new RegExp(`^${p}`), "")
      .replace(new RegExp(`_${p}`, "g"), "_")
      .replace(new RegExp(`${p}$`), "");
  }
  return out.replace(/__+/g, "_").replace(/^_+|_+$/g, "");
}

function pickSuccessStatus(
  responses: Record<string, unknown>,
): string | undefined {
  if (Object.hasOwn(responses ?? {}, "200")) {
    return "200";
  }
  if (Object.hasOwn(responses ?? {}, "201")) {
    return "201";
  }
  const twoXX = Object.keys(responses || {}).find((k) => /^2\d\d$/.test(k));
  return twoXX;
}

function toPascalCase(input: string): string {
  const spaced = input.replace(/([0-9])([a-zA-Z])/g, "$1 $2");
  return spaced
    .split(/[^a-zA-Z0-9]+|\s+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function opResponsesTypeName(method: string, rawPath: string): string {
  const segments = rawPath
    .replace(/^\//, "")
    .split("/")
    .map((seg) => {
      const m = seg.match(/^\{(.+)\}$/);
      if (m) return `By${toPascalCase(m[1] as string)}`;
      return toPascalCase(seg);
    });
  const methodPart = toPascalCase(method);
  return `${methodPart}${segments.join("")}Responses`;
}

function opResponseTypeName(method: string, rawPath: string): string {
  return opResponsesTypeName(method, rawPath).replace(/Responses$/, "Response");
}

// Local $ref resolver for OpenAPI components only.
function resolvePointer(ref: string): unknown {
  if (!ref?.startsWith("#/")) return {};
  const parts = ref
    .slice(2)
    .split("/")
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  let cur: unknown = openapi as unknown;
  for (const part of parts) {
    if (
      cur &&
      typeof cur === "object" &&
      part in (cur as Record<string, unknown>)
    ) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return {};
    }
  }
  return cur;
}

function derefSchema(schema: unknown, seen: Set<unknown> = new Set()): unknown {
  if (!schema || typeof schema !== "object") return schema;
  const ref = (schema as { $ref?: unknown }).$ref;
  if (typeof ref === "string") {
    const target = resolvePointer(ref);
    if (seen.has(target)) return target;
    seen.add(target);
    return derefSchema(target, seen);
  }
  if (Array.isArray(schema)) {
    return schema.map((item) => derefSchema(item, seen));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(schema as Record<string, unknown>)) {
    out[k] = derefSchema(v, seen);
  }
  return out;
}

function hasRef(schema: unknown, seen = new Set<object>()): boolean {
  if (!schema || typeof schema !== "object") return false;
  if (seen.has(schema as object)) return false;
  seen.add(schema as object);
  const ref = (schema as { $ref?: unknown }).$ref;
  if (typeof ref === "string") {
    return true;
  }
  if (Array.isArray(schema)) {
    return schema.some((it) => hasRef(it, seen));
  }
  for (const v of Object.values(schema as Record<string, unknown>)) {
    if (hasRef(v, seen)) return true;
  }
  return false;
}

function shrinkPayload(
  value: unknown,
  schema: unknown,
  depth = 0,
  path: string[] = [],
): unknown {
  if (depth > 8) return value; // guard against extreme nesting
  if (value == null) return value;

  // Arrays: keep a single representative item
  if (Array.isArray(value)) {
    if (value.length === 0) return value;
    const items = (schema as { items?: unknown | unknown[] })?.items;
    const itemSchema = Array.isArray(items) ? items[0] : items;
    // For top-level `servers` array, keep 2–3 items; otherwise keep 1
    const isTopLevelServers = path.length === 1 && path[0] === "servers";
    const keep = isTopLevelServers
      ? Math.min(value.length, 2 + Math.floor(Math.random() * 2))
      : 1;
    const out: unknown[] = [];
    for (let i = 0; i < keep; i++) {
      out.push(shrinkPayload(value[i], itemSchema, depth + 1, path));
    }
    return out;
  }

  // Objects: keep required keys and a small, meaningful subset of optionals
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    const s =
      (schema as {
        properties?: Record<string, unknown>;
        required?: string[];
      }) || {};
    const props: Record<string, unknown> = s.properties || {};
    const required: string[] = s.required || [];

    for (const key of required) {
      if (key in obj) {
        out[key] = shrinkPayload(
          obj[key],
          (props as Record<string, unknown>)[key],
          depth + 1,
          [...path, key],
        );
      }
    }

    const optionals = Object.keys(obj).filter((k) => !required.includes(k));

    // Prefer semantically meaningful fields when present
    const meaningfulOrder = [
      "title",
      "name",
      "version",
      "description",
      "server",
      "_meta",
    ];
    for (const k of meaningfulOrder) {
      if (k in obj && !(k in out)) {
        out[k] = shrinkPayload(
          obj[k],
          (props as Record<string, unknown>)[k],
          depth + 1,
          [...path, k],
        );
      }
    }

    if (optionals.length > 0) {
      // Prefer array-typed properties or names that look like lists
      const schemaKeys = Object.keys(props);
      const weighted = optionals
        .filter((k) => !(k in out))
        .map((k) => {
          const ps = (props as Record<string, unknown>)[k] as
            | { type?: string; items?: unknown }
            | undefined;
          const isArray =
            ps?.type === "array" || typeof ps?.items !== "undefined";
          const nameBias = /servers|items|list|data|results/i.test(k);
          const schemaOrder = Math.max(0, schemaKeys.indexOf(k));
          const weight = (isArray ? 2 : 0) + (nameBias ? 1 : 0);
          return { k, weight, schemaOrder };
        });
      weighted.sort(
        (a, b) => b.weight - a.weight || a.schemaOrder - b.schemaOrder,
      );
      const MAX_OPTIONALS = 3;
      for (const { k } of weighted.slice(0, MAX_OPTIONALS)) {
        if (k in obj) {
          out[k] = shrinkPayload(
            obj[k],
            (props as Record<string, unknown>)[k],
            depth + 1,
            [...path, k],
          );
        }
      }
    }
    return out;
  }

  // Strings: clamp length
  if (typeof value === "string") {
    return value.length > 60 ? value.slice(0, 60) : value;
  }

  return value;
}

function getFixtureRelPath(safePath: string, method: string): string {
  return `./fixtures/${safePath}/${method}.${FIXTURE_EXT}`;
}

function enrichServersFixture(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;
  const obj = payload as Record<string, unknown>;
  const servers = Array.isArray(obj.servers)
    ? (obj.servers as unknown[])
    : null;
  if (!servers) return payload;
  const updated = servers.map((item, idx) => {
    if (!item || typeof item !== "object") return item;
    const it = item as Record<string, unknown>;
    let server: Record<string, unknown>;
    if (it.server && typeof it.server === "object") {
      server = it.server as Record<string, unknown>;
    } else {
      server = {} as Record<string, unknown>;
      it.server = server;
    }
    if (
      !server.title ||
      typeof server.title !== "string" ||
      server.title.length === 0
    ) {
      server.title = `Sample Server ${idx + 1}`;
    }
    if (
      !server.name ||
      typeof server.name !== "string" ||
      server.name.length === 0
    ) {
      const slug = String(server.title)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      server.name = `io.example/${slug || `server-${idx + 1}`}`;
    }
    if (
      !server.version ||
      typeof server.version !== "string" ||
      server.version.length === 0
    ) {
      server.version = "1.0.0";
    }
    return it;
  });
  (obj as Record<string, unknown>).servers = updated;
  if (!obj.metadata || typeof obj.metadata !== "object") {
    obj.metadata = { count: updated.length };
  } else {
    const m = obj.metadata as Record<string, unknown>;
    if (typeof m.count !== "number") m.count = updated.length;
  }
  return obj;
}

function asJson(
  value: unknown,
): string | number | boolean | null | Record<string, unknown> | unknown[] {
  if (value === null) return null;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") {
    return value as string | number | boolean;
  }
  if (Array.isArray(value)) return value as unknown[];
  if (t === "object") return value as Record<string, unknown>;
  return String(value);
}

function getJsonSchemaFromOperation(
  operation: unknown,
  status: string,
): unknown {
  const op = operation as { responses?: Record<string, unknown> };
  const res = op.responses?.[status] as
    | { content?: Record<string, unknown> }
    | undefined;
  const content = (res?.content as Record<string, unknown> | undefined)?.[
    "application/json"
  ] as { schema?: unknown } | undefined;
  return content?.schema;
}

export function autoGenerateHandlers() {
  const result: RequestHandler[] = [];

  // Prefer Vite glob import when available (Vitest/Vite runtime)
  const fixtureImporters: Record<string, () => Promise<unknown>> =
    typeof import.meta.glob === "function"
      ? import.meta.glob("./fixtures/**", { import: "default" })
      : {};

  const specPaths = Object.entries(
    ((openapi as { paths?: Record<string, unknown> }).paths ?? {}) as Record<
      string,
      unknown
    >,
  );
  const httpMethods = ["get", "post", "put", "patch", "delete"] as const;
  const handlersByMethod = {
    get: http.get,
    post: http.post,
    put: http.put,
    patch: http.patch,
    delete: http.delete,
  } as const;

  for (const [rawPath, pathItem] of specPaths) {
    for (const method of httpMethods) {
      const operation = (pathItem as Record<string, unknown>)[method];
      if (!operation) continue;

      const mswPath = `*/${rawPath
        .replace(/^\//, "")
        .replace(/\{([^}]+)\}/g, ":$1")}`;

      result.push(
        handlersByMethod[method](mswPath, async () => {
          const responsesObj =
            (operation as { responses?: Record<string, unknown> }).responses ??
            {};
          const successStatus = pickSuccessStatus(responsesObj);

          const safePath = stripPrefixes(toFileSafe(rawPath));
          const fixtureFileName = path.join(
            FIXTURES_PATH,
            `${safePath}`,
            `${method}.${FIXTURE_EXT}`,
          );

          if (!fs.existsSync(path.dirname(fixtureFileName))) {
            fs.mkdirSync(path.dirname(fixtureFileName), { recursive: true });
          }

          const hasFile = fs.existsSync(fixtureFileName);
          if (!hasFile && successStatus !== "204") {
            let payload: unknown;
            if (successStatus) {
              const schema = getJsonSchemaFromOperation(
                operation,
                successStatus,
              );
              if (schema) {
                try {
                  let resolved = derefSchema(schema);
                  // Attempt to fully resolve nested refs if any remain
                  let guard = 0;
                  while (hasRef(resolved) && guard++ < 5) {
                    resolved = derefSchema(resolved);
                  }
                  if (hasRef(resolved)) {
                    throw new Error(
                      "Unresolved $ref remains after dereferencing passes",
                    );
                  }
                  const generated = jsf.generate(
                    resolved as Parameters<typeof jsf.generate>[0],
                  );
                  payload = shrinkPayload(generated, resolved, 0, []);
                  // Improve developer experience: ensure minimal fields for servers list
                  if (
                    rawPath === "/registry/v0.1/servers" &&
                    method === "get"
                  ) {
                    payload = enrichServersFixture(payload);
                  }
                } catch (e) {
                  console.error(
                    "[auto-mocker] jsf.generate failed for",
                    method.toUpperCase(),
                    rawPath,
                    e,
                  );
                }
              } else {
                console.error(
                  "[auto-mocker] no JSON schema for",
                  method.toUpperCase(),
                  rawPath,
                  "status",
                  successStatus,
                );
              }
            }

            if (payload !== undefined) {
              const opType = successStatus
                ? opResponseTypeName(method, rawPath)
                : undefined;
              const tsModule = buildMockModule(payload, opType);
              try {
                fs.writeFileSync(fixtureFileName, tsModule);
                console.log("[auto-mocker] wrote", fixtureFileName);
              } catch (e) {
                console.error(
                  "[auto-mocker] failed to write fixture",
                  fixtureFileName,
                  e,
                );
              }
            }
          }

          if (successStatus === "204") {
            return new HttpResponse(null, { status: 204 });
          }

          let data: unknown;
          const relPath = getFixtureRelPath(safePath, method);
          try {
            const importer = fixtureImporters?.[relPath];
            if (importer) {
              const mod = (await importer()) as unknown;
              data = (mod as { default?: unknown })?.default ?? mod;
            } else {
              const mod = (await import(relPath)) as unknown;
              data = (mod as { default?: unknown })?.default ?? mod;
            }
          } catch (e) {
            return new HttpResponse(
              `[auto-mocker] Missing mock fixture: ${relPath}. ${
                e instanceof Error ? e.message : ""
              }`,
              { status: 500 },
            );
          }

          const validateSchema = getJsonSchemaFromOperation(
            operation,
            successStatus ?? "200",
          );
          if (validateSchema) {
            // Fully dereference before validation to avoid local $ref to components
            let resolved = derefSchema(validateSchema);
            let guard = 0;
            while (hasRef(resolved) && guard++ < 5) {
              resolved = derefSchema(resolved);
            }
            let isValid = ajv.validate(resolved as AnySchema, data as unknown);
            // Treat empty object as invalid when schema exposes properties.
            if (
              isValid &&
              data &&
              typeof data === "object" &&
              !Array.isArray(data) &&
              Object.keys(data as Record<string, unknown>).length === 0 &&
              (resolved as { properties?: Record<string, unknown> })
                ?.properties &&
              Object.keys(
                (resolved as { properties?: Record<string, unknown> })
                  .properties ?? {},
              ).length > 0
            ) {
              isValid = false;
            }
            if (!isValid) {
              const message = `fixture validation failed for ${method.toUpperCase()} ${rawPath} -> ${fixtureFileName}`;
              console.error("[auto-mocker]", message, ajv.errors || []);
              return new HttpResponse(`[auto-mocker] ${message}`, {
                status: 500,
              });
            }
          } else {
            // No JSON schema to validate against: explicit failure
            const message = `no JSON schema for ${method.toUpperCase()} ${rawPath} status ${
              successStatus ?? "200"
            }`;
            console.error("[auto-mocker]", message);
            return new HttpResponse(`[auto-mocker] ${message}`, {
              status: 500,
            });
          }

          const jsonValue = asJson(data);
          try {
            let serversLen: number | undefined;
            if (
              jsonValue &&
              typeof jsonValue === "object" &&
              Object.hasOwn(jsonValue, "servers")
            ) {
              const s = (jsonValue as Record<string, unknown>).servers;
              if (Array.isArray(s)) serversLen = s.length;
            }
            console.log(
              `[auto-mocker] respond ${method.toUpperCase()} ${rawPath} -> ${
                successStatus ? Number(successStatus) : 200
              } ${
                serversLen !== undefined ? `servers=${serversLen}` : ""
              } (${fixtureFileName})`,
            );
          } catch {}
          return HttpResponse.json(jsonValue, {
            status: successStatus ? Number(successStatus) : 200,
          });
        }),
      );
    }
  }

  return result;
}

export const autoGeneratedHandlers = autoGenerateHandlers();
