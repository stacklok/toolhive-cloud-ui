## Note: This is an experimental project that is actively being developed and tested - features may change without notice

[![License: Apache 2.0][license-img]][license]
[![Discord][discord-img]][discord]

# ToolHive Cloud UI

A Next.js application for visualizing MCP (Model Context Protocol) servers running in user infrastructure with easy URL copying for integration with AI agents.

**Repository**: https://github.com/stacklok/toolhive-cloud-ui  
**Backend API**: [toolhive-registry-server](https://github.com/stacklok/toolhive-registry-server) - Implements the official MCP Registry API

## Quick Start

### Prerequisites

- **Node.js** 20+ and **pnpm** 10+
- For Kubernetes deployment: **Docker**, **Kind**, **Helm**, **kubectl**

## Developer Guide

### Local Development

This section covers all available commands and development workflows.

```bash
# Install dependencies
pnpm install

# Copy environment variables template (optional for development)
cp .env.example .env.local
```

```bash
# Start full dev environment (Next.js + OIDC mock + MSW mock server)
pnpm dev

# Application will be available at http://localhost:3000
```

### Available Commands

#### Development Commands (pnpm)

```bash
# Full development environment (recommended)
pnpm dev              # Starts Next.js + OIDC mock + MSW mock server
                     # - Next.js: http://localhost:3000
                     # - OIDC Mock: http://localhost:3001
                     # - MSW Mock API: http://localhost:9090

# Individual services
pnpm dev:next        # Start only Next.js dev server
pnpm dev:mock-server # Start Next.js + MSW mock (requires real OIDC provider configured)
pnpm dev:mock-oidc   # Start Next.js + OIDC mock (requires real backend API configured)
pnpm oidc            # Start only OIDC mock provider
pnpm mock:server     # Start only MSW standalone mock server

# Production build
pnpm build           # Build optimized production bundle
pnpm start           # Start production server (after build)

# Code quality
pnpm lint            # Run Biome linter
pnpm format          # Auto-format code with Biome
pnpm test            # Run Vitest tests
pnpm type-check      # TypeScript compilation check

# API client generation
pnpm generate-client         # Fetch swagger.json and regenerate client
pnpm generate-client:nofetch # Regenerate client without fetching
```

#### Make Commands

For convenience, common pnpm commands are also available as Make targets:

```bash
# Development
make install         # Install dependencies
make dev             # Run dev server (pnpm dev)
make dev-next        # Run only Next.js (pnpm dev:next)
make dev-mock-server # Run with MSW only (pnpm dev:mock-server)
make lint            # Run linter
make format          # Format code
make test            # Run tests
make type-check      # Type checking
make generate-client # Generate API client

# Docker (see Docker section below)
make build           # Build Docker image
make start           # Start container
# ... (see Docker section)

# Kubernetes (see Kubernetes section below)
make kind-setup      # Setup Kind cluster
make kind-deploy     # Deploy to Kind
# ... (see Kubernetes section)
```

### Development Workflow

#### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/stacklok/toolhive-cloud-ui.git
cd toolhive-cloud-ui

# Install dependencies
pnpm install

# Copy environment variables (optional for dev)
cp .env.example .env.local
```

#### 2. Start Development Server

```bash
# Full environment (recommended)
pnpm dev
```

This starts:

- **Next.js** on `http://localhost:3000` - Main application
- **OIDC Mock** on `http://localhost:3001` - Mock authentication provider
- **MSW Mock Server** on `http://localhost:9090` - Mock backend API

**Note**: For other development modes (different combinations of mock/real services), see the [Development Modes](#development-modes) section below.

#### 3. Code Quality Checks

Before committing:

```bash
# Run all checks
pnpm lint            # Check code style
pnpm format          # Auto-fix formatting
pnpm type-check      # Verify TypeScript
pnpm test            # Run test suite
```

Git hooks (via Husky) automatically run linting on staged files.

#### 4. API Client Updates

When the backend API changes:

```bash
# Fetch latest swagger.json and regenerate client
pnpm generate-client

# Files updated:
# - swagger.json
# - src/generated/**
```

**Note**: Never edit files in `src/generated/` manually - they are auto-generated.

### Development Modes

Choose the mode that best fits your development needs:

#### Mode 1: Full Stack Development (Default - Recommended)

```bash
pnpm dev
```

**What runs**:

- ✅ Mock OIDC authentication (`localhost:3001`)
- ✅ Mock backend API via MSW (`localhost:9090`)
- ✅ Next.js dev server (`localhost:3000`)

**Best for**: Frontend development without external dependencies

---

#### Mode 2: Mock OIDC + Real Backend API

```bash
pnpm dev:mock-oidc
```

**What runs**:

- ✅ Mock OIDC authentication (`localhost:3001`)
- ❌ **No API mock** - requires real backend API configured
- ✅ Next.js dev server (`localhost:3000`)

**Best for**: Backend integration testing with mock authentication

**Required configuration** in `.env.local`:

```bash
API_BASE_URL=https://your-backend-api.com  # Real backend API URL
```

---

#### Mode 3: Mock Backend API + Real OIDC

```bash
pnpm dev:mock-server
```

**What runs**:

- ❌ **No OIDC mock** - requires real OIDC provider configured
- ✅ Mock backend API via MSW (`localhost:9090`)
- ✅ Next.js dev server (`localhost:3000`)

**Best for**: Authentication integration testing with mock backend

**Required configuration** in `.env.local`:

```bash
OIDC_ISSUER_URL=https://your-oidc-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_OIDC_PROVIDER_ID=okta  # or your provider
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:3000
```

---

#### Mode 4: Real Services Only

```bash
pnpm dev:next
```

**What runs**:

- ❌ No OIDC mock
- ❌ No API mock
- ✅ Next.js dev server only (`localhost:3000`)

**Best for**: Full production-like testing with real services

**Required configuration** in `.env.local`:

```bash
# Real OIDC provider
OIDC_ISSUER_URL=https://your-oidc-provider.com
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_OIDC_PROVIDER_ID=okta

# Real backend API
API_BASE_URL=https://your-backend-api.com

# Auth configuration
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:3000
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage

# Run specific test file
pnpm test src/components/navbar.test.tsx
```

Tests use:

- **Vitest** - Test runner
- **Testing Library** - React component testing
- **MSW** - API mocking

### Mock Server

The project includes a standalone MSW mock server for development:

```bash
# Start standalone mock server
pnpm mock:server
# Available at http://localhost:9090
```

Features:

- Auto-generates mocks from OpenAPI schema
- Customizable fixtures in `src/mocks/fixtures/`
- Custom handlers in `src/mocks/customHandlers/`

See [`docs/mocks.md`](./docs/mocks.md) for details.

## Environment Variables

### Required for Production

| Variable                       | Description                  | Example                                 |
| ------------------------------ | ---------------------------- | --------------------------------------- |
| `OIDC_ISSUER_URL`              | OIDC provider's issuer URL   | `https://auth.example.com`              |
| `OIDC_CLIENT_ID`               | OAuth2 client ID             | `your-client-id`                        |
| `OIDC_CLIENT_SECRET`           | OAuth2 client secret         | `your-client-secret`                    |
| `NEXT_PUBLIC_OIDC_PROVIDER_ID` | Provider identifier (public) | `okta`, `auth0`, `oidc`                 |
| `BETTER_AUTH_SECRET`           | Secret for token encryption  | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL`              | Application base URL         | `https://your-app.example.com`          |
| `API_BASE_URL`                 | Backend API URL              | `https://api.example.com`               |

### Optional

| Variable          | Description                             | Default                                                |
| ----------------- | --------------------------------------- | ------------------------------------------------------ |
| `TRUSTED_ORIGINS` | Comma-separated list of trusted origins | `BASE_URL,http://localhost:3002,http://localhost:3003` |

### Development (Auto-configured)

When running `pnpm dev`, these are automatically configured:

```bash
NODE_ENV=development
OIDC_ISSUER_URL=http://localhost:3001
OIDC_CLIENT_ID=web-client
OIDC_CLIENT_SECRET=web-secret
NEXT_PUBLIC_OIDC_PROVIDER_ID=oidc
BETTER_AUTH_URL=http://localhost:3000
API_BASE_URL=http://localhost:9090
```

### Configuration File

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

**Note**: `.env.local` is git-ignored and should never be committed.

## Docker

This project includes Docker support for containerized deployments.

### Using Makefile (Recommended)

```bash
# Show all available commands
make help

# Build Docker image
make build

# Start container
make start

# View logs
make logs

# Stop container
make stop

# Clean up (remove container and image)
make clean

# Rebuild from scratch
make rebuild
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Kubernetes / Kind Deployment

This project includes a complete Helm chart for deploying to Kubernetes (optimized for Kind).

### Quick Start with Kind

```bash
# Create cluster and deploy (first time)
make kind-setup

# Or step by step:
# 1. Create Kind cluster
make kind-create

# 2. Deploy application
make kind-deploy

# 3. Access the application
make kind-port-forward
# Then open: http://localhost:8080

# View logs
make kind-logs

# Uninstall
make kind-uninstall

# Delete cluster
make kind-delete
```

### Helm Chart

The Helm chart is located in the `helm/` directory and includes:

- Deployment with configurable replicas
- Service (ClusterIP/NodePort/LoadBalancer)
- Horizontal Pod Autoscaler (optional)
- Configurable resource limits
- Health checks (startup, liveness and readiness probes)
- Security contexts following Pod Security Standards

### CI/CD

The chart is automatically tested on every push using GitHub Actions with Kind:

- **Helm Lint**: Validates chart syntax and best practices
- **Integration Test**: Deploys to Kind cluster and verifies the app responds

## Project Documentation

For detailed information about the project:

- **[AGENTS.md](./AGENTS.md)** - Project overview, architecture, and key patterns
- **[CLAUDE.md](./CLAUDE.md)** - Detailed development guidelines
- **[docs/mocks.md](./docs/mocks.md)** - MSW mock server documentation
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute

### Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **UI**: React 19 + shadcn/ui + Tailwind CSS 4
- **Auth**: Better Auth (OIDC)
- **API Client**: hey-api + React Query
- **Testing**: Vitest + Testing Library
- **Linting**: Biome

### Related Projects

- **[toolhive-registry-server](https://github.com/stacklok/toolhive-registry-server)** - Backend API implementing the official MCP Registry API
- **[ToolHive Studio](https://github.com/stacklok/toolhive-studio)** - Desktop application for running and managing MCP servers locally

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Better Auth Documentation](https://www.better-auth.com)
- [hey-api Documentation](https://heyapi.vercel.app)
- [shadcn/ui Components](https://ui.shadcn.com)
- [MCP Registry Official](https://github.com/modelcontextprotocol/registry)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on how to get started.

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](./LICENSE) file for details.

<!-- Badge references -->

[license-img]: https://img.shields.io/badge/License-Apache2.0-blue.svg?style=flat
[license]: https://opensource.org/licenses/Apache-2.0
[discord-img]: https://img.shields.io/discord/1184987096302239844?style=flat&logo=discord&logoColor=white&label=Discord
[discord]: https://discord.gg/stacklok
