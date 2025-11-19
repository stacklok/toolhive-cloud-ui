# AI Agent Guidelines - ToolHive Cloud UI

This document provides essential context for AI coding assistants (Claude, GitHub Copilot, Cursor, etc.) working on this codebase.

## Quick Start

**IMPORTANT**: Before making any code changes, read:

1. This file (AGENTS.md) - Project overview and key patterns
2. `CLAUDE.md` - Detailed guidelines for AI assistants
3. `README.md` - Setup and deployment instructions
4. `docs/mocks.md` - MSW auto-mocker, fixtures, and dev server

## Project Summary

**ToolHive Cloud UI** is a Next.js 16 application for visualizing MCP (Model Context Protocol) servers in user infrastructure.

- **Repository**: https://github.com/stacklok/toolhive-cloud-ui
- **Backend API**: https://github.com/stacklok/toolhive-registry-server
- **License**: Apache 2.0 (Open Source)

## Technology Stack

| Category        | Technology                    |
| --------------- | ----------------------------- |
| Framework       | Next.js 16 (App Router)       |
| Language        | TypeScript (strict mode)      |
| UI Library      | React 19 + React Compiler     |
| Styling         | Tailwind CSS 4                |
| Components      | shadcn/ui                     |
| Auth            | Better Auth (OIDC, stateless) |
| API Client      | hey-api + React Query         |
| Testing         | Vitest + Testing Library      |
| Linting         | Biome                         |
| Package Manager | pnpm                          |

## Core Principles

1. **Server Components First** - Use `'use client'` only when necessary
2. **Generated API Client** - Never write manual fetch logic, use hey-api hooks
3. **Async/Await Only** - No `.then()` promise chains
4. **🚫 NEVER USE `any`** - STRICTLY FORBIDDEN. Use `unknown` with type guards or proper types
5. **Stateless Auth** - JWT tokens, no server-side sessions

## ⚠️ Before Suggesting Code

**IMPORTANT**: This is a Next.js 16 App Router application. Before suggesting any code:

1. **Check [Next.js Documentation](https://nextjs.org/docs)** - Verify your approach is correct
2. **Validate your suggestion** - Ensure it follows App Router conventions
3. **Consider Server vs Client** - Default to Server Components, only use Client when needed
4. **Use Next.js built-ins** - File-system routing, caching, revalidation, etc.

Common Next.js patterns that AI agents often get wrong:

- ❌ Using old Pages Router patterns in App Router
- ❌ Creating custom routing when file-system routing should be used
- ❌ Not understanding Server vs Client Component boundaries
- ❌ Missing `'use client'` or adding it unnecessarily
- ❌ Not leveraging Next.js caching and revalidation

## Project Structure

```
src/
├── app/              # Next.js App Router (pages, layouts, routes)
├── components/ui/    # shadcn/ui components (DO NOT EDIT)
├── lib/              # Utilities, auth config
├── generated/        # hey-api output (DO NOT EDIT)
└── hooks/            # Custom React hooks

src/mocks/            # MSW auto-mocker, handlers, fixtures, and dev server

dev-auth/             # Development OIDC mock
helm/                 # Kubernetes deployment
scripts/              # Build scripts
```

## Common Commands

```bash
# Development
pnpm dev              # Start dev server + OIDC mock
pnpm mock:server      # Start standalone MSW mock server (http://localhost:9090)
pnpm dev:next        # Start only Next.js
pnpm oidc            # Start only OIDC mock

# Code Quality
pnpm lint            # Run linter
pnpm format          # Auto-format code
pnpm type-check      # TypeScript validation
pnpm test            # Run tests

# API Client
pnpm generate-client # Regenerate from backend API
```

## Mocking & Fixtures

- Schema-based mocks are generated automatically. To create a new mock for an endpoint, run a Vitest test (or the app in dev) that calls that endpoint. The first call writes a fixture under `src/mocks/fixtures/<sanitized-path>/<method>.ts`.
- To adjust the payload, edit the generated fixture file. Prefer this over adding a non-schema mock when you only need more realistic sample data.
- Non-schema mocks live in `src/mocks/customHandlers` and take precedence over schema-based mocks. Use these for behavior overrides or endpoints without schema.

- Global test setup: Add common mocks to `vitest.setup.ts` (e.g., `next/headers`, `next/navigation`, `next/image`, `sonner`, auth client). Before copying a mock into a test file, check if it can be centralized globally. Reset all mocks globally between tests.

## Next.js App Router Key Concepts

### File-System Routing

- **Use file-system routing** - Routes are defined by folder structure
- **Naming conventions**: `page.tsx` (route), `layout.tsx` (shared UI), `loading.tsx` (loading states), `error.tsx` (error boundaries)
- **Don't create custom routing logic** - Use Next.js conventions

```
app/
├── page.tsx              # / route
├── layout.tsx            # Root layout
├── dashboard/
│   ├── page.tsx          # /dashboard route
│   ├── layout.tsx        # Dashboard layout
│   └── servers/
│       ├── page.tsx      # /dashboard/servers
│       └── [name]/
│           └── page.tsx  # /dashboard/servers/:name (dynamic)
```

### Server vs Client Components

**Server Components (default)**:

- Fetch data directly with async/await
- Access backend resources
- No event handlers, no browser APIs, no hooks
- Faster, reduced bundle size

**Client Components (`'use client'`)**:

- Interactive elements (onClick, onChange)
- Browser APIs (window, localStorage, clipboard)
- React hooks (useState, useEffect, useContext)
- hey-api React Query hooks

### Data Fetching

**Server Component**:

```typescript
async function ServerList() {
  const response = await fetch("/registry/v0.1/servers", {
    next: { revalidate: 3600 }, // In dev, Next rewrites proxy to mock server
  });
  const data = await response.json();
  return <ServerList servers={data} />;
}
```

**Client Component**:

```typescript
"use client";
import { useGetApiV0Servers } from "@/generated/client/@tanstack/react-query.gen";

function ServerList() {
  const { data, isLoading } = useGetApiV0Servers();
  return <div>{data?.map(...)}</div>;
}
```

### Server Actions (Mutations)

Prefer Server Actions over API routes for mutations:

```typescript
"use server";
import { revalidatePath } from "next/cache";

export async function createServer(formData: FormData) {
  await db.server.create({ data: formData });
  revalidatePath("/servers"); // Revalidate cache
  return { success: true };
}
```

### Caching & Revalidation

- `next: { revalidate: 3600 }` - Time-based revalidation
- `next: { tags: ['servers'] }` - Tag-based cache
- `revalidatePath('/servers')` - On-demand revalidation
- `revalidateTag('servers')` - Invalidate tagged cache

## Essential Patterns

### Server Component (Data Fetching)

```typescript
// app/servers/page.tsx
async function ServersPage() {
  const response = await fetch("http://api/servers", {
    next: { revalidate: 3600 },
  });
  const servers = await response.json();
  return <ServerList servers={servers} />;
}
```

### Client Component (Interactive)

```typescript
"use client";

import { useGetApiV0Servers } from "@/generated/client/@tanstack/react-query.gen";

function ServerList() {
  const { data, isLoading, error } = useGetApiV0Servers();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorDisplay error={error} />;

  return <div>{data?.map(server => ...)}</div>;
}
```

### Server Action (Mutation)

```typescript
"use server";

import { revalidatePath } from "next/cache";

export async function createServer(formData: FormData) {
  try {
    await db.server.create({ data: formData });
    revalidatePath("/servers");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create server" };
  }
}
```

## Critical Rules

### ✅ ALWAYS DO

- Use Server Components by default
- Use hey-api generated hooks for API calls
- Use `async/await` (never `.then()`)
- Use shadcn/ui components
- Handle errors with user-friendly messages
- Add JSDoc for complex functions (explain why, not what)
- Check TypeScript and linter before committing
- Follow existing patterns in codebase

### ❌ NEVER DO

- **Use `any` type** - STRICTLY FORBIDDEN. Use `unknown` + type guards or proper types
- Edit files in `src/generated/*` (auto-generated)
- Use `'use client'` on every component
- Create manual fetch logic in components
- Use `.then()` promise chains
- Create custom Button/Dialog/Card components
- Ignore TypeScript or linting errors
- Mass refactor without clear reason
- Create API routes for simple mutations (use Server Actions)

## API Integration

### Backend API Endpoints

- `GET /api/v0/servers` - List MCP servers
- `GET /api/v0/servers/{name}` - Server details
- `GET /api/v0/deployed` - Deployed instances
- `GET /api/v0/deployed/{name}` - Instance details

### Using Generated API Client

**Queries (GET)**:

```typescript
import { useGetApiV0Servers } from "@/generated/client/@tanstack/react-query.gen";

const { data, isLoading, error } = useGetApiV0Servers();
```

**Mutations (POST/PUT/DELETE)**:

```typescript
import { usePostApiV0Servers } from "@/generated/client/@tanstack/react-query.gen";

const mutation = usePostApiV0Servers();
await mutation.mutateAsync({ body: data });
```

**When Backend Changes**:

```bash
pnpm generate-client  # Fetch swagger.json and regenerate
```

## Authentication

### Production

- OIDC provider agnostic
- Stateless JWT authentication
- Environment variables: `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`

### Development

- Mock OIDC provider (runs via `pnpm dev`)
- MSW for API mocking
- No real authentication needed

## Testing

### Test Structure

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("Component", () => {
  it("does something", async () => {
    render(<Component />);
    await waitFor(() => {
      expect(screen.getByText("Expected")).toBeInTheDocument();
    });
  });
});
```

### What to Test

- User interactions
- Authentication flows
- Error scenarios
- Loading states
- Accessibility

## Common Mistakes

### 1. Client Components Everywhere

```typescript
// ❌ BAD
"use client";
function Page() {
  return <div>Static content</div>;
}

// ✅ GOOD
function Page() {
  return <div>Static content</div>;
}
```

### 2. Manual Fetch Logic

```typescript
// ❌ BAD
const [data, setData] = useState(null);
useEffect(() => {
  fetch("/api")
    .then((r) => r.json())
    .then(setData);
}, []);

// ✅ GOOD
const { data } = useGetApiV0Servers();
```

### 3. Promise Chains

```typescript
// ❌ BAD
fetch("/api")
  .then((r) => r.json())
  .then((data) => process(data));

// ✅ GOOD
const response = await fetch("/api");
const data = await response.json();
process(data);
```

### 4. Custom UI Components

```typescript
// ❌ BAD
function CustomButton({ children, onClick }) {
  return (
    <button className="..." onClick={onClick}>
      {children}
    </button>
  );
}

// ✅ GOOD
import { Button } from "@/components/ui/button";
<Button onClick={onClick}>{children}</Button>;
```

### 5. Using `any` Type (🚫 STRICTLY FORBIDDEN)

```typescript
// ❌ FORBIDDEN - NEVER USE any
function process(data: any) {
  return data.value;
}

// ✅ GOOD - Use proper types
interface Data {
  value: string;
}
function process(data: Data) {
  return data.value;
}

// ✅ GOOD - Use unknown with type guards for truly unknown types
function process(data: unknown) {
  if (isData(data)) {
    return data.value;
  }
  throw new Error("Invalid data");
}

function isData(value: unknown): value is Data {
  return typeof value === "object" && value != null && "value" in value;
}
```

## Debugging

- **TypeScript Errors**: `pnpm type-check` - Fix errors, don't suppress
- **Linter Errors**: `pnpm lint` and `pnpm format`
- **API Issues**: Check `NEXT_PUBLIC_API_URL`, verify backend is running, regenerate client
- **Auth Issues**: Dev - ensure `pnpm dev` running; Prod - check `OIDC_*` env vars

## Resources

### Documentation

- **Project Guides**: AGENTS.md, CLAUDE.md, copilot-instructions.md (MUST READ)
- **Next.js**: https://nextjs.org/docs
- **Better Auth**: https://www.better-auth.com
- **hey-api**: https://heyapi.vercel.app
- **shadcn/ui**: https://ui.shadcn.com

### Related Projects

- **Backend API**: https://github.com/stacklok/toolhive-registry-server
- **MCP Registry**: https://github.com/modelcontextprotocol/registry

## Decision Making

When implementing features:

1. **Check existing patterns** - Look for similar code in the codebase
2. **Server or Client?** - Default to Server Component
3. **API calls?** - Use hey-api hooks
4. **UI components?** - Use shadcn/ui
5. **Mutations?** - Prefer Server Actions over API routes
6. **Uncertain?** - Ask before implementing

## Code Review Checklist

Before marking a task complete:

- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Uses hey-api hooks (no manual fetch)
- [ ] Server Components by default
- [ ] Proper error handling
- [ ] Loading states implemented
- [ ] Uses `async/await` (no `.then()`)
- [ ] Follows existing patterns
- [ ] JSDoc for complex functions
- [ ] Tests pass
- [ ] No unnecessary refactoring

## Contributing

This is an **open-source** project. Write code that:

- Is easy to understand and maintain
- Follows the established patterns
- Is properly tested and documented
- Considers other contributors

---

**Remember**: Simple, readable code is better than clever code. When in doubt, check the project documentation (AGENTS.md, CLAUDE.md) and existing codebase patterns.
