# OIDC Authentication Setup

This application supports authentication with any OIDC-compliant identity provider (Okta, Keycloak, Auth0, etc.).

## Configuration

1. **Configure your OIDC provider** with these settings:
   - **Callback URL**: `http://localhost:3000/api/auth/oauth2/callback/oidc` (adjust domain/port for production)
   - **Grant Types**: Authorization Code, Refresh Token
   - **Response Type**: code
   - **Scopes**: openid, email, profile

2. **Set environment variables** in `.env.local`:

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET=your-random-secret-here
BETTER_AUTH_URL=http://localhost:3000

# OIDC Provider Configuration
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
OIDC_ISSUER_URL=https://your-oidc-provider.com
```

## Local Development

For local testing, this repo includes a test OIDC provider:

1. **Start the OIDC provider**:
   ```bash
   pnpm oidc
   ```

2. **Use these credentials** in `.env.local`:
   ```bash
   OIDC_CLIENT_ID=better-auth-dev
   OIDC_CLIENT_SECRET=dev-secret-change-in-production
   OIDC_ISSUER_URL=http://localhost:4000
   ```

3. **Run the app**:
   ```bash
   pnpm dev
   ```

   Or run both concurrently:
   ```bash
   pnpm dev
   ```

The test provider automatically logs in as `test@example.com`.

## Provider-Specific Guides

### Okta

1. Create a new App Integration (OIDC - Web Application)
2. Set Callback URL: `http://localhost:3000/api/auth/oauth2/callback/oidc`
3. Use Okta domain as OIDC_ISSUER_URL (e.g., `https://dev-12345.okta.com`)

### Keycloak

1. Create a new Client
2. Set Access Type: confidential
3. Set Valid Redirect URIs: `http://localhost:3000/api/auth/oauth2/callback/oidc`
4. Use Realm URL as OIDC_ISSUER_URL (e.g., `https://keycloak.example.com/realms/myrealm`)

### Auth0

1. Create a Regular Web Application
2. Set Allowed Callback URLs: `http://localhost:3000/api/auth/oauth2/callback/oidc`
3. Use Auth0 domain as OIDC_ISSUER_URL (e.g., `https://your-tenant.auth0.com`)

## Architecture

This application uses **stateless authentication**:
- No database required
- Session data stored in encrypted JWE cookies
- 7-day session expiration with 30-day refresh window
- Works with any OIDC-compliant provider
