MSW Auto-Mocker

- Handlers: `src/mocks/handlers.ts` combines non-schema mocks and auto-generated mocks.
- Non-schema mocks: add hand-written handlers in `src/mocks/customHandlers/index.ts`. These take precedence over schema-based mocks.
- Auto-generated: `src/mocks/mocker.ts` reads `swagger.json` and creates fixtures under `src/mocks/fixtures` on first run.
- Validation: Loaded fixtures are validated with Ajv; errors log to console.

Usage
- Vitest: tests initialize MSW in `src/mocks/test.setup.ts`. Run `pnpm test`.
- Browser (optional): call `startWorker()` from `src/mocks/browser.ts` in your development entry point to mock requests in the browser.
- Standalone server (dev): `pnpm mock:server` starts an HTTP mock server at `http://localhost:9090`. In dev, Next.js rewrites proxy `/registry/*` to this origin; use relative URLs like `/registry/v0.1/servers` from both client and server code.

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
