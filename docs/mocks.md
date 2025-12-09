MSW Auto-Mocker

- Handlers: `src/mocks/handlers.ts` combines non-schema mocks and auto-generated mocks.
- Non-schema mocks: add hand-written handlers in `src/mocks/customHandlers/index.ts`. These take precedence over schema-based mocks.
- Auto-generated: `src/mocks/mocker.ts` reads `swagger.json` and creates fixtures under `src/mocks/fixtures` on first run.

Usage
- Vitest: tests initialize MSW in `src/mocks/test.setup.ts`. Run `pnpm test`.
- Browser (optional): call `startWorker()` from `src/mocks/browser.ts` in your development entry point to mock requests in the browser.
- Standalone server (dev): `pnpm mock:server` starts an HTTP mock server at `http://localhost:9090` (configurable via `API_BASE_URL`). In dev, Next.js rewrites proxy `/registry/*` to this origin; use relative URLs like `/registry/v0.1/servers` from both client and server code.

Generating fixtures
- To create a new fixture for an endpoint, simply run a Vitest test (or the app in dev) that calls that endpoint. The auto‑mocker will generate `src/mocks/fixtures/<sanitized-path>/<method>.ts` on first use using schema‑based fake data.
- To customize the response, edit the generated TypeScript file. This is preferred over writing a non‑schema mock for simple data tweaks (e.g., replacing lorem ipsum with realistic text). Non‑schema mocks are intended for behavior overrides or endpoints without schema.

Regeneration
- Delete a fixture file to re-generate it on next request.

Failure behavior (always strict)
- If a schema is missing or faker fails, the handler responds 500 and does not write a placeholder.
- Invalid fixtures (including empty `{}` when the schema defines properties) respond 500.

Types
- Fixtures default to strict types. Generated modules import response types from `@api/types.gen` and use a `satisfies` clause to ensure compatibility.
- Make sure `tsconfig.json` includes: `"paths": { "@api/*": ["./src/generated/*"] }`.

## Test-Scoped Overrides with AutoAPIMock

Each fixture is wrapped in `AutoAPIMock<T>`, which provides test-scoped override capabilities.

### Fixture Structure

Generated fixtures use named exports with a consistent naming convention:

```typescript
// src/mocks/fixtures/registry_v0_1_servers/get.ts
import type { GetRegistryV01ServersResponse } from "@api/types.gen";
import { AutoAPIMock } from "@mocks";

export const mockedGetRegistryV01Servers = AutoAPIMock<GetRegistryV01ServersResponse>({
  servers: [...],
  metadata: { count: 15 },
});
```

### Overriding in Tests

Use `.override()` to customize responses for specific tests:

```typescript
import { HttpResponse } from "msw";
import { mockedGetRegistryV01Servers } from "@mocks/fixtures/registry_v0_1_servers/get";

describe("ServerList", () => {
  it("shows empty state when no servers", async () => {
    // Override to return empty list for this test only (type-safe)
    mockedGetRegistryV01Servers.override(() => ({
      servers: [],
      metadata: { count: 0 },
    }));

    render(<ServerList />);
    expect(screen.getByText("No servers available")).toBeVisible();
  });

  it("shows error state on API failure", async () => {
    // Use overrideHandler for error responses
    mockedGetRegistryV01Servers.overrideHandler(() =>
      HttpResponse.json({ error: "Server error" }, { status: 500 })
    );

    render(<ServerList />);
    expect(screen.getByText("Failed to load servers")).toBeVisible();
  });

  it("shows servers from default fixture", async () => {
    // No override - uses default fixture data
    render(<ServerList />);
    expect(screen.getByText("AWS Nova Canvas")).toBeVisible();
  });
});
```

### API Reference

```typescript
interface AutoAPIMockInstance<T> {
  // The default fixture data
  defaultValue: T;

  // Override the response data (type-safe, preferred)
  override(fn: (data: T, info: ResponseResolverInfo) => T): this;

  // Override the full handler (for errors, network failures, invalid data)
  overrideHandler(fn: (data: T, info: ResponseResolverInfo) => Response): this;

  // Reset to default behavior (called automatically before each test)
  reset(): this;

  // Internal handler used by MSW (don't call directly)
  generatedHandler: HttpResponseResolver;
}
```

### Choosing Between `override` and `overrideHandler`

Use **`override`** (type-safe, preferred) when you just want to change the response data:

```typescript
// Simple - just return the data you want
mockedGetRegistryV01Servers.override(() => ({
  servers: [],
  metadata: { count: 0 },
}));

// With default data modifications
mockedGetRegistryV01Servers.override((data) => ({
  ...data,
  servers: data.servers?.slice(0, 3),
}));
```

Use **`overrideHandler`** (full control) when you need:
- Custom HTTP status codes (errors)
- Non-JSON responses
- Network errors
- Invalid/malformed data for edge case testing

```typescript
// Return error status
mockedGetRegistryV01Servers.overrideHandler(() =>
  HttpResponse.json({ error: "Server error" }, { status: 500 })
);

// Network error
mockedGetRegistryV01Servers.overrideHandler(() => HttpResponse.error());

// Testing invalid data shapes
mockedGetRegistryV01Servers.overrideHandler(() =>
  HttpResponse.json({ servers: [{ server: null }] })
);
```

### Automatic Reset

Overrides are automatically reset before each test via `beforeEach()` in `src/mocks/test.setup.ts`. You don't need to manually reset mocks between tests.

### Using Default Data in Overrides

Access the default fixture data to make partial modifications:

```typescript
// With override (type-safe, preferred)
mockedGetRegistryV01Servers.override((data) => ({
  ...data,
  servers: data.servers?.slice(0, 1),
}));

// With overrideHandler (when you need the Response wrapper)
mockedGetRegistryV01Servers.overrideHandler((data) =>
  HttpResponse.json({
    ...data,
    servers: data.servers?.slice(0, 1),
  })
);
```

### Accessing Request Info

Both methods receive request info as the second parameter:

```typescript
// With override (type-safe)
mockedGetRegistryV01Servers.override((data, info) => {
  const cursor = new URL(info.request.url).searchParams.get("cursor");
  return cursor === "page2"
    ? { servers: [], metadata: { count: 0 } }
    : data;
});

// With overrideHandler (when you need different status codes based on request)
mockedGetRegistryV01Servers.overrideHandler((data, info) => {
  const authHeader = info.request.headers.get("Authorization");
  if (!authHeader) {
    return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return HttpResponse.json(data);
});
