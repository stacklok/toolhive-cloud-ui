# Claude AI Assistant Guide - ToolHive Cloud UI

This document provides context and guidelines for Claude (and other AI assistants) working on the ToolHive Cloud UI codebase.

## Project Overview

**ToolHive Cloud UI** is an open-source Next.js 16 application for visualizing and managing MCP (Model Context Protocol) servers running in user infrastructure. It provides a catalog interface with detailed server information, tool listings, and URL copy functionality.

**Repository**: https://github.com/stacklok/toolhive-cloud-ui  
**Backend API**: https://github.com/stacklok/toolhive-registry-server  
**License**: Apache 2.0 (Open Source)

## Core Technology Stack

- **Framework**: Next.js 16.0.3 (App Router)
- **React**: 19.2.0 with React Compiler (babel-plugin-react-compiler)
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Authentication**: Better Auth (OIDC, stateless JWT)
- **API Client**: hey-api (@hey-api/openapi-ts) with React Query
- **Testing**: Vitest + Testing Library
- **Linting**: Biome (replaces ESLint + Prettier)
- **Package Manager**: pnpm

## ⚠️ Critical: Validate Against Next.js Documentation

**Before suggesting any code or architecture changes**:

1. **Consult [Next.js Documentation](https://nextjs.org/docs)** - Verify your approach is correct
2. **This is App Router, not Pages Router** - Different conventions and patterns
3. **Validate Server vs Client boundaries** - Understand what runs where
4. **Check built-in features** - Next.js provides routing, caching, data fetching, etc.
5. **Don't reinvent the wheel** - Use Next.js conventions and built-ins

**Common mistakes AI assistants make with Next.js**:

- ❌ Mixing Pages Router and App Router patterns
- ❌ Creating custom routing when file-system routing exists
- ❌ Not understanding Server Components (no hooks, no event handlers)
- ❌ Adding `'use client'` everywhere or forgetting it when needed
- ❌ Ignoring Next.js caching and revalidation mechanisms
- ❌ Using old data fetching patterns (getServerSideProps, getStaticProps)

**When in doubt**: Check the [Next.js App Router documentation](https://nextjs.org/docs/app) first, then propose a solution.

## Architecture Principles

### 1. Server Components First

- **Default to Server Components** - They're faster, reduce bundle size, and can directly access backend resources
- **Use Client Components only when necessary**:
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (window, localStorage, clipboard)
  - React hooks (useState, useEffect, useContext)
  - hey-api React Query hooks

**Why**: Server Components reduce JavaScript sent to the client, improve initial page load, and allow direct data fetching.

### 2. Stateless Authentication

- JWT-based authentication with no server-side session storage
- OIDC provider agnostic (works with any OIDC-compliant provider)
- Better Auth handles token validation and renewal

**Why**: Stateless auth scales horizontally without session storage, crucial for cloud deployments.

### 3. Generated API Client

- **Never write manual fetch logic** - Always use hey-api generated functions
- **Never edit generated files** - They are regenerated from OpenAPI spec and changes will be lost
- **Use server actions for all API calls** - Client components should not call the API directly
- API client regenerated from OpenAPI spec via custom script
- Type-safe API calls with proper error handling

**Why**: Generated client ensures type safety and stays in sync with backend API. Server-only API access keeps the backend URL secure and reduces client bundle size.

### 4. Async/Await Over Promises

- **Always use async/await** - Never use `.then()` chains
- Better error handling with try/catch
- More readable, sequential code flow

**Why**: Async/await is more readable, easier to debug, and handles errors better than promise chains.

### 5. TypeScript Strict Mode

- **🚫 NEVER use `any` type** - STRICTLY FORBIDDEN in this codebase
- Use `unknown` with type guards for truly unknown types
- Use proper interfaces, types, or generics instead
- Prefer `as const` over `enum`
- Use proper type inference and utility types

**Why**: The `any` type defeats the entire purpose of TypeScript. It eliminates type safety, hides bugs, and makes code unmaintainable. Strict typing catches bugs at compile time, improves IDE support, and serves as living documentation.

## Development Workflow

### Initial Setup

```bash
pnpm install                # Install dependencies
pnpm generate-client        # Generate API client from backend
```

### Daily Development

```bash
pnpm dev                    # Start Next.js + OIDC mock
pnpm dev:next              # Start only Next.js
pnpm oidc                   # Start only OIDC mock
pnpm lint                   # Run Biome linter
pnpm format                 # Auto-format code
pnpm test                   # Run tests
pnpm type-check            # TypeScript validation
```

### When Backend API Changes

```bash
pnpm generate-client        # Fetch swagger.json and regenerate
pnpm generate-client:nofetch # Regenerate without fetching
```

## Critical Rules

### DO ✅

1. **Read project documentation first** - Check AGENTS.md and CLAUDE.md for all guidelines
2. **Use Server Components by default** - Mark Client Components explicitly
3. **Use hey-api hooks exclusively** - No manual fetch in components
4. **Use async/await** - Never `.then()` chains
5. **Use shadcn/ui components** - Don't create custom UI primitives
6. **Handle errors properly** - Always show user-friendly error messages
7. **Add JSDoc for complex functions** - Explain why, not what
8. **Keep code DRY** - Extract repeated logic
9. **Follow existing patterns** - Check similar files before creating new patterns
10. **Run linter and type-check** - Before considering task complete

### DON'T ❌

1. **🚫 Don't EVER use `any` type** - STRICTLY FORBIDDEN. Use `unknown` + type guards or proper types
2. **🚫 Don't EVER edit generated files** - `src/generated/*` is auto-generated and will be overwritten
   - Generated files are overwritten on every `pnpm generate-client` run
   - If you need to configure or extend the client, do it in your own files
3. **Don't use `'use client'` everywhere** - Only when necessary
4. **Don't create custom fetch logic** - Use hey-api hooks
5. **Don't use `.then()`** - Use async/await
6. **Don't create custom UI components** - Use shadcn/ui
7. **Don't ignore TypeScript errors** - Fix them, don't suppress
8. **Don't mass refactor** - Make targeted, incremental improvements
9. **Don't create API routes for simple mutations** - Use Server Actions
10. **Don't skip error handling** - Always handle errors gracefully

## API Integration Details

### Backend API

- **Base URL**: Configured via `API_BASE_URL` (server-side only)
- **Format**: Official MCP Registry API (upstream compatible)
- **Endpoints**:
  - `GET /api/v0/servers` - List all MCP servers
  - `GET /api/v0/servers/{name}` - Get server details
  - `GET /api/v0/deployed` - List deployed instances
  - `GET /api/v0/deployed/{name}` - Get deployed instance details

### Code Generation Flow

1. **Script** (`scripts/generate-swagger.ts`) fetches `swagger.json` from backend
2. **hey-api** (`@hey-api/openapi-ts`) generates:
   - TypeScript types (`types.gen.ts`)
   - API client functions
   - React Query hooks
   - Utility functions
3. **Import** generated hooks in components: `@/generated/client/@tanstack/react-query.gen`

## Authentication Flow

### Production

1. User accesses protected route
2. Redirected to `/signin`
3. Better Auth initiates OIDC flow with configured provider
4. Provider redirects back with authorization code
5. Better Auth exchanges code for tokens
6. JWT stored in secure HTTP-only cookie
7. User redirected to original destination

### Development

1. Mock OIDC provider runs on separate port (started via `pnpm dev`)
2. No real authentication required
3. MSW mocks API responses
4. Simulates production auth flow for testing

## Testing Strategy

### What to Test

- User interactions (clicks, form submissions)
- Authentication flows (login, logout, protected routes)
- Error scenarios (API failures, network errors)
- Loading states and skeleton screens
- Accessibility (keyboard navigation, screen readers)

### Testing Best Practices

- **Prefer `toBeVisible()` over `toBeInTheDocument()`** - `toBeVisible()` checks that an element is actually visible to the user (not hidden via CSS, `aria-hidden`, etc.), while `toBeInTheDocument()` only checks DOM presence. Use `toBeVisible()` for positive assertions and `.not.toBeInTheDocument()` for absence checks.

### Mocking & Testing

- **MSW Auto-Mocker**

  - Auto-generates handlers from `swagger.json` and creates fixtures under `src/mocks/fixtures` on first run.
  - Strict validation with Ajv + ajv-formats; fixtures are type-checked against `@api/types.gen` by default.
  - Hand-written, non-schema mocks live in `src/mocks/customHandlers` and take precedence over schema-based mocks.
  - Dev: `pnpm mock:server` starts a standalone HTTP mock on `http://localhost:9090` (configurable via `API_BASE_URL`). In dev, Next rewrites proxy `/registry/*` there; always use relative URLs like `/registry/v0.1/servers`.
  - Regenerate by deleting specific fixture files.
  - Create new fixtures by calling the desired endpoint in a Vitest test (or via the app in dev). The first call generates a TypeScript fixture file; customize the payload by editing that file instead of writing a new custom handler when you only need different sample data.
  - Prefer global test setup for common mocks: add shared mocks to `vitest.setup.ts` (e.g., `next/headers`, `next/navigation`, `next/image`, `sonner`, auth client). Before adding a mock in a specific test file, check if it belongs in the global setup.

- **Vitest** - Test runner (faster than Jest)
- **Testing Library** - Component testing
- **jsdom** - DOM simulation

### E2E Tests (Playwright)

- End-to-end tests live under `tests/e2e` and run against a **production build**.
- Commands:
  - `pnpm test:e2e` – builds the app and runs E2E tests
  - `pnpm test:e2e:ui` – builds and opens Playwright UI mode for interactive debugging
  - `pnpm test:e2e:debug` – builds and runs with Playwright Inspector
- CI runs E2E tests via `.github/workflows/e2e.yml` (builds first, then tests)
- Install browsers locally once: `pnpm exec playwright install`

Tests use custom fixtures for authentication. The `authenticatedPage` fixture handles login automatically.

**Note on rate limiting:** Better Auth has a default rate limit of 3 sign-in requests per 10 seconds. E2E tests override this via `BETTER_AUTH_RATE_LIMIT=100` to allow multiple tests to authenticate in quick succession without triggering 429 errors.

### Example Test

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, it, expect } from "vitest";

describe("ServerList", () => {
  it("displays servers and handles copy", async () => {
    render(<ServerList />);

    await waitFor(() => {
      expect(screen.getByText("Server 1")).toBeVisible();
    });

    const copyButton = screen.getByRole("button", { name: /copy url/i });
    await userEvent.click(copyButton);

    expect(screen.getByText(/copied/i)).toBeVisible();
  });
});
```

## Deployment

### Docker

- Multi-stage Dockerfile for optimized image size
- Built automatically on Git tag push
- Published to GitHub Container Registry

### Kubernetes/Helm

- Helm chart in `helm/` directory
- Optimized for Kind (local Kubernetes)
- Includes HPA, health checks, security contexts
- Deploy: `make kind-setup`

### Release Process

```bash
git tag v0.x.x
git push origin v0.x.x
# GitHub Actions builds and publishes Docker image
```

## Troubleshooting

### TypeScript Errors in Generated Files

- **Don't edit** `src/generated/*`
- **Fix**: Regenerate with `pnpm generate-client`
- If persists, check backend API schema

### Authentication Not Working

- **Development**:
  - Ensure OIDC mock is running (`pnpm oidc`) or start the full stack with `pnpm dev`
  - Dev provider issues refresh tokens unconditionally and uses a short AccessToken TTL (15s) to exercise the refresh flow
  - If you see origin errors (403), ensure `BETTER_AUTH_URL` matches the port you use (default `http://localhost:3000`) or include it in `TRUSTED_ORIGINS`
- **Production**: Check environment variables:
  - `OIDC_ISSUER_URL` - OIDC provider URL
  - `OIDC_CLIENT_ID` - OAuth2 client ID
  - `OIDC_CLIENT_SECRET` - OAuth2 client secret
  - `OIDC_PROVIDER_ID` - Provider identifier (e.g., "okta", "oidc") - Required, server-side only.
  - `BETTER_AUTH_URL` - Application base URL
  - `BETTER_AUTH_SECRET` - Secret for token encryption

### API Calls Failing

- Check `API_BASE_URL` environment variable
- Verify backend API is running
- Check browser console for CORS errors

### Linter Errors

- Run `pnpm lint` to see all errors
- Run `pnpm format` to auto-fix formatting
- Check `biome.json` for configuration

## Working with Claude

### Best Practices

1. **Ask questions** - If requirements are unclear, ask before implementing
2. **Check existing code** - Look for similar patterns in the codebase
3. **Read the documentation** - All guidelines are in AGENTS.md, CLAUDE.md, and copilot-instructions.md
4. **Incremental changes** - Small, focused changes are better than large refactors
5. **Test your changes** - Run linter, type-check, and tests
6. **Explain reasoning** - Use JSDoc to explain why, not what

### When Creating New Features

1. Check if similar feature exists
2. Identify if Server or Client Component needed
3. Use hey-api hooks for API calls
4. Use shadcn/ui for UI components
5. Implement proper error handling
6. Add loading states
7. Write tests
8. Update documentation if needed

### When Fixing Bugs

1. Understand the root cause (don't just patch symptoms)
2. Check if it's a TypeScript or linting error first
3. Look at the full context (don't just fix one file)
4. Add tests to prevent regression
5. Verify fix doesn't break other functionality

## References

- **Project Documentation**: AGENTS.md, CLAUDE.md, copilot-instructions.md (READ FIRST)
- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **Better Auth**: https://www.better-auth.com
- **hey-api**: https://heyapi.vercel.app
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS 4**: https://tailwindcss.com
- **Biome**: https://biomejs.dev

## Support

For questions or issues:

- **Backend API**: https://github.com/stacklok/toolhive-registry-server
- **Frontend UI**: https://github.com/stacklok/toolhive-cloud-ui
- **MCP Registry**: https://github.com/modelcontextprotocol/registry

---

**Remember**: This is an open-source project. Write clean, maintainable code that others can understand and contribute to. When in doubt, favor simplicity over cleverness.
