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

Use `.override()` for type-safe response modifications, or `.overrideHandler()` for full control (errors, network failures):

```typescript
import { HttpResponse } from "msw";
import { mockedGetRegistryV01Servers } from "@mocks/fixtures/registry_v0_1_servers/get";

// Type-safe data override
mockedGetRegistryV01Servers.override(() => ({
  servers: [],
  metadata: { count: 0 },
}));

// Modify default data
mockedGetRegistryV01Servers.override((data) => ({
  ...data,
  servers: data.servers?.slice(0, 3),
}));

// Error responses (use overrideHandler)
mockedGetRegistryV01Servers.overrideHandler(() =>
  HttpResponse.json({ error: "Server error" }, { status: 500 })
);

// Network error
mockedGetRegistryV01Servers.overrideHandler(() => HttpResponse.error());
```

Overrides are automatically reset before each test via `beforeEach()` in `src/mocks/test.setup.ts`.

### Reusable Scenarios

Define named scenarios in your fixture for commonly used test states:

```typescript
// src/mocks/fixtures/registry_v0_1_servers/get.ts
import type { GetRegistryV01ServersResponse } from "@api/types.gen";
import { AutoAPIMock } from "@mocks";
import { HttpResponse } from "msw";

export const mockedGetRegistryV01Servers = AutoAPIMock<GetRegistryV01ServersResponse>({
  servers: [...],
  metadata: { count: 15 },
})
  .scenario("empty-servers", (self) =>
    self.override(() => ({
      servers: [],
      metadata: { count: 0 },
    })),
  )
  .scenario("server-error", (self) =>
    self.overrideHandler(() =>
      HttpResponse.json({ error: "Internal Server Error" }, { status: 500 }),
    ),
  );
```

Then use them in tests:

```typescript
import { MockScenarios } from "@mocks";
import { mockedGetRegistryV01Servers } from "@mocks/fixtures/registry_v0_1_servers/get";

describe("getServers", () => {
  it("returns empty array when API returns no servers", async () => {
    mockedGetRegistryV01Servers.activateScenario(MockScenarios.EmptyServers);

    const servers = await getServers();
    expect(servers).toEqual([]);
  });

  it("throws on 500 server error", async () => {
    mockedGetRegistryV01Servers.activateScenario(MockScenarios.ServerError);

    await expect(getServers()).rejects.toBeDefined();
  });
});
```

### Global Scenario Activation

Use `activateMockScenario` to activate a scenario across all registered mocks at once. This is useful for setting up a consistent state across multiple endpoints, with the option to further customize individual mocks afterwards.

```typescript
import { activateMockScenario, MockScenarios } from "@mocks";
import { mockedGetRegistryV01Servers } from "@mocks/fixtures/registry_v0_1_servers/get";

describe("error handling", () => {
  it("shows error page when all APIs fail", async () => {
    // Activate "server-error" on all mocks that define it
    // Mocks without this scenario will use their default response
    activateMockScenario(MockScenarios.ServerError);

    // Test that the app handles the error state correctly
    render(<App />);
    expect(screen.getByText("Something went wrong")).toBeVisible();
  });

  it("handles partial failures gracefully", async () => {
    // Start with all APIs returning errors
    activateMockScenario(MockScenarios.ServerError);

    // Then customize specific endpoints to succeed
    mockedGetRegistryV01Servers.override((data) => data);

    // Now only other endpoints return errors, servers endpoint works
    render(<Dashboard />);
    expect(screen.getByText("Servers loaded")).toBeVisible();
  });
});
```

Scenario names are defined in `src/mocks/scenarioNames.ts` via the `MockScenarios` object, which provides autocomplete and JSDoc documentation. Global scenarios are automatically reset before each test via `resetAllAutoAPIMocks()` in the test setup.
