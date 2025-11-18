/* eslint-disable @typescript-eslint/no-explicit-any */

import Ajv from "ajv";
import fs from "fs";
import { JSONSchemaFaker as jsf } from "json-schema-faker";
import { HttpResponse, http } from "msw";
import path from "path";
import { fileURLToPath } from "url";
import { buildMockModule } from "./mockTemplate";

// ===== Config =====
// Adjust the path of the OpenAPI JSON here if needed.
// This repo keeps it at project root as `swagger.json`.
const USE_TYPES_FOR_FIXTURES = false; // set true if you have @api/types.gen alias

// Strip these noisy prefixes from generated fixture folder names.
const PREFIXES_TO_STRIP = ["api_v1beta_", "api_v0_"];

// Allow forcing regeneration of fixtures via env flag.
const FORCE_REGENERATE = process.env.AUTO_MOCKER_FORCE === "1";

// ===== Runtime setup =====
// Resolve module directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_PATH = path.join(__dirname, "fixtures");
const FIXTURE_EXT = "ts";

// Load OpenAPI JSON (supports resolveJsonModule in TS config)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - JSON import relies on TS config (resolveJsonModule)
import openapi from "../../swagger.json";

// Ajv configuration
const ajv = new Ajv({ strict: true });
// Ignore vendor extensions like x-enum-varnames
(ajv as any).addKeyword("x-enum-varnames");

// json-schema-faker options
jsf.option({ alwaysFakeOptionals: true });
jsf.option({ fillProperties: true });
jsf.option({ minItems: 1 });
jsf.option({ maxItems: 3 });
jsf.option({ failOnInvalidTypes: false });
jsf.option({ failOnInvalidFormat: false });

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

function pickSuccessStatus(responses: Record<string, any>): string | undefined {
  if (responses?.["200"]) return "200";
  if (responses?.["201"]) return "201";
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
function resolvePointer(ref: string): any {
  if (!ref?.startsWith("#/")) return {};
  const parts = ref
    .slice(2)
    .split("/")
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  let cur: any = openapi as any;
  for (const part of parts) {
    cur = cur?.[part];
    if (cur === undefined) return {};
  }
  return cur;
}

function derefSchema<T = any>(schema: any, seen = new Set()): T {
  if (!schema || typeof schema !== "object") return schema;
  if ((schema as any).$ref && typeof (schema as any).$ref === "string") {
    const target = resolvePointer((schema as any).$ref as string);
    if (seen.has(target)) return target as T;
    seen.add(target);
    return derefSchema(target, seen);
  }
  if (Array.isArray(schema)) {
    return schema.map((item) => derefSchema(item, seen)) as any;
  }
  const out: any = {};
  for (const [k, v] of Object.entries(schema)) {
    out[k] = derefSchema(v, seen);
  }
  return out as T;
}

function hasRef(schema: unknown, seen = new Set<object>()): boolean {
  if (!schema || typeof schema !== "object") return false;
  if (seen.has(schema as object)) return false;
  seen.add(schema as object);
  // @ts-expect-error index signature
  if ((schema as any).$ref && typeof (schema as any).$ref === "string") {
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

function getFixtureRelPath(safePath: string, method: string): string {
  return `./fixtures/${safePath}/${method}.${FIXTURE_EXT}`;
}

export function autoGenerateHandlers() {
  const result: any[] = [];

  // Prefer Vite glob import when available (Vitest/Vite runtime)
  const fixtureImporters: Record<string, () => Promise<unknown>> =
    // @ts-expect-error - vite-specific API available in vite/vitest
    typeof (import.meta as any).glob === "function"
      ? // @ts-ignore
        (import.meta as any).glob("./fixtures/**", { import: "default" })
      : {};

  const specPaths = Object.entries(
    ((openapi as any).paths ?? {}) as Record<string, any>,
  );
  const httpMethods = ["get", "post", "put", "patch", "delete"] as const;

  for (const [rawPath, pathItem] of specPaths) {
    for (const method of httpMethods) {
      const operation = pathItem?.[method];
      if (!operation) continue;

      const mswPath = `*/${rawPath.replace(/^\//, "").replace(/\{([^}]+)\}/g, ":$1")}`;

      result.push(
        // @ts-expect-error index signature for http[method]
        http[method](mswPath, async () => {
          const successStatus = pickSuccessStatus(operation.responses || {});

          const safePath = stripPrefixes(toFileSafe(rawPath));
          const fileBase = `${safePath}/${method}.${FIXTURE_EXT}`;
          const fixtureFileName = path.join(
            FIXTURES_PATH,
            `${safePath}`,
            `${method}.${FIXTURE_EXT}`,
          );

          if (!fs.existsSync(path.dirname(fixtureFileName))) {
            fs.mkdirSync(path.dirname(fixtureFileName), { recursive: true });
          }

          const hasFile = fs.existsSync(fixtureFileName);
          if ((FORCE_REGENERATE || !hasFile) && successStatus !== "204") {
            let payload: any | undefined;
            if (successStatus) {
              const schema =
                operation.responses?.[successStatus]?.content?.[
                  "application/json"
                ]?.schema;
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
                  payload = jsf.generate(resolved);
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
              const tsModule = buildMockModule(payload, {
                opType,
                useTypes: USE_TYPES_FOR_FIXTURES,
              });
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

          let data: any;
          const relPath = getFixtureRelPath(safePath, method);
          try {
            const importer = fixtureImporters?.[relPath];
            if (importer) {
              const mod: any = await importer();
              data = mod?.default ?? mod;
            } else {
              const mod: any = await import(relPath);
              data = mod?.default ?? mod;
            }
          } catch (e) {
            return new HttpResponse(
              `[auto-mocker] Missing mock fixture: ${relPath}. ${e instanceof Error ? e.message : ""}`,
              { status: 500 },
            );
          }

          const validateSchema =
            operation.responses?.[successStatus ?? "200"]?.content?.[
              "application/json"
            ]?.schema;
          if (validateSchema) {
            const resolved = derefSchema(validateSchema);
            let isValid = ajv.validate(resolved, data);
            // Treat empty object as invalid when schema exposes properties.
            if (
              isValid &&
              data &&
              typeof data === "object" &&
              !Array.isArray(data) &&
              Object.keys(data as any).length === 0 &&
              (resolved as any)?.properties &&
              Object.keys((resolved as any).properties).length > 0
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
            const message = `no JSON schema for ${method.toUpperCase()} ${rawPath} status ${successStatus ?? "200"}`;
            console.error("[auto-mocker]", message);
            return new HttpResponse(`[auto-mocker] ${message}`, {
              status: 500,
            });
          }

          return HttpResponse.json(data, {
            status: successStatus ? Number(successStatus) : 200,
          });
        }),
      );
    }
  }

  return result;
}

export const autoGeneratedHandlers = autoGenerateHandlers();
