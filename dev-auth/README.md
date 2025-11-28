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
- **Supported Scopes**: openid, email, profile, offline_access
- **Redirect URIs**: Ports 3000-3003 supported

## Dev-only behavior

This provider is intended only for local development:

- Issues refresh tokens unconditionally (independent of requested scopes)
- Auto-consents and auto-logs in a test user
- Access tokens expire quickly (15s) to exercise the refresh flow

Do not use this configuration in production.

## For Production

Replace this with a real OIDC provider (Okta, Keycloak, Auth0, etc.) by updating the environment variables in `.env.local`:

- `OIDC_ISSUER_URL` - OIDC provider URL
- `OIDC_CLIENT_ID` - OAuth2 client ID
- `OIDC_CLIENT_SECRET` - OAuth2 client secret
- `OIDC_PROVIDER_ID` - Provider identifier (e.g., "okta", "oidc") - **Required**, server-side only.
- `BETTER_AUTH_URL` - Application base URL (e.g., `http://localhost:3000`)
- `BETTER_AUTH_SECRET` - Secret for token encryption
