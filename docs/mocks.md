MSW Auto-Mocker

- Handlers: `src/mocks/handlers.ts` combines non-schema mocks and auto-generated mocks.
- Non-schema mocks: add hand-written handlers in `src/mocks/customHandlers/index.ts`. These run before auto-generated handlers so they can replace or extend behavior when needed.
- Auto-generated: `src/mocks/mocker.ts` reads `swagger.json` and creates fixtures under `src/mocks/fixtures` on first run.
- Validation: Loaded fixtures are validated with Ajv; errors log to console.

Usage
- Vitest: tests initialize MSW in `src/mocks/test.setup.ts`. Run `pnpm test`.
- Browser (optional): call `startWorker()` from `src/mocks/browser.ts` in your development entry point to mock requests in the browser.
- Standalone server (dev): `pnpm mock:server` starts an HTTP mock server at `http://localhost:9090` (configurable with `MOCK_PORT`). Point API requests or Next.js rewrites to this origin to develop without a live backend.

Regeneration
- Delete a fixture file to re-generate it on next request.

Failure behavior (always strict)
- If a schema is missing or faker fails, the handler responds 500 and does not write a placeholder.
- Invalid fixtures (including empty `{}` when the schema defines properties) respond 500.

Types (optional)
- If you expose OpenAPI response types under `@api/types.gen`, set `USE_TYPES_FOR_FIXTURES = true` in `src/mocks/mocker.ts` to add a `satisfies` clause in generated fixtures.
