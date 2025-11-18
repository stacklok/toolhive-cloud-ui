MSW Auto-Mocker

- Handlers: `src/mocks/handlers.ts` combines custom and auto-generated.
- Custom: add overrides in `src/mocks/customHandlers/index.ts`.
- Auto-gen: `src/mocks/mocker.ts` reads `swagger.json` and creates fixtures in `src/mocks/fixtures` on first run.
- Validation: Loaded fixtures are validated with Ajv; errors log to console.

Usage
- Vitest: already wired via `src/mocks/test.setup.ts`. Run `pnpm test`.
- Browser dev (optional): import and call `startWorker()` from `src/mocks/browser.ts` in your app's dev entry.
- Standalone server (dev): run `pnpm mock:server` to start an HTTP mock server on `http://localhost:9090` (configurable via `MOCK_PORT`). Point your app's API base URL or a Next.js rewrite to this server to consume mock data without a real backend.

Regeneration
- Delete a fixture file or run with `AUTO_MOCKER_FORCE=1` to re-generate.

Failure behavior (always strict)
- If a schema is missing or faker fails, the handler responds 500 and does not write a placeholder.
- Invalid fixtures (including empty `{}` when the schema defines properties) respond 500.

Types (optional)
- If you expose OpenAPI response types under `@api/types.gen`, set `USE_TYPES_FOR_FIXTURES = true` in `src/mocks/mocker.ts` to add a `satisfies` clause in generated fixtures.
