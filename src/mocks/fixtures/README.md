Fixtures are auto-generated on first run by the MSW Auto-Mocker.

- Files are TypeScript modules under this directory mirroring API routes.
- Each module default-exports the mock payload returned by the handler.
- You can edit these files to tailor responses for tests or local dev.

Notes
- Custom handlers in `src/mocks/customHandlers` run before auto-generated ones.
- To force re-generate a fixture, delete it or set env `AUTO_MOCKER_FORCE=1`.
- If your project exposes OpenAPI response types via `@api/types.gen`, you can
  enable type enforcement by setting `USE_TYPES_FOR_FIXTURES = true` in
  `src/mocks/mocker.ts`.
- Always strict: missing/failed generation returns 500 (no placeholder), and invalid fixtures return 500.
