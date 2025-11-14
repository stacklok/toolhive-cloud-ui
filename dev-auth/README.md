# Local Development OIDC Provider

This directory contains a simple OIDC provider for local development and testing.

## What is it?

A minimal OIDC-compliant identity provider built with `oidc-provider` that:
- Automatically logs in a test user (`test@example.com`)
- Auto-approves all consent requests
- Supports standard OAuth 2.0 / OIDC flows

## How to use

Start the provider:
```bash
pnpm oidc
```

Or run it alongside the Next.js app:
```bash
pnpm dev
```

The provider runs on `http://localhost:4000` and is already configured in `.env.local`.

## Configuration

The provider is pre-configured with:
- **Client ID**: `better-auth-dev`
- **Client Secret**: `dev-secret-change-in-production`
- **Test User**: `test@example.com` (Test User)
- **Supported Scopes**: openid, email, profile
- **Redirect URIs**: Ports 3000-3003 supported

## Production-like Setup

For a production-like local environment with Keycloak, see [`DOCKER_DEPLOYMENT.md`](../DOCKER_DEPLOYMENT.md) in the root directory.

The Docker Compose setup includes:
- Keycloak as a real identity provider
- Next.js app in production mode
- Proper authentication flow (no auto-login)

## For Production

Replace this with a real OIDC provider (Okta, Keycloak, Auth0, etc.) by updating the environment variables in `.env.local`:
- `OIDC_ISSUER_URL`
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET`
