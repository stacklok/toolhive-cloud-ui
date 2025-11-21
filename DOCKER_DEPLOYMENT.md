# Docker Deployment (Production-like Local Stack)

This setup runs a production-like environment locally using Docker Compose with:
- **Keycloak** as the OIDC identity provider
- **Next.js app** in production mode with Keycloak authentication

This simulates how the application would run in production with a real identity provider.

## Prerequisites

- Docker and Docker Compose installed
- Ports 3002 and 8080 available

## Quick Start

1. **Start the stack**:
   ```bash
   docker compose up --build
   ```

2. **Wait for services to be ready**:
   - Keycloak: http://localhost:8080 (takes ~30 seconds)
   - App: http://localhost:3002

3. **Log in to the app**:
   - Click "Sign In with OIDC"
   - Username: `test`
   - Password: `test`

## Architecture

```
┌─────────────┐         ┌──────────────┐
│             │         │              │
│   Browser   │────────▶│   Next.js    │
│             │         │   (port 3002)│
└─────────────┘         └───────┬──────┘
                                │
                                │ OIDC Auth
                                ▼
                        ┌──────────────┐
                        │              │
                        │   Keycloak   │
                        │   (port 8080)│
                        └──────────────┘
```

## Configuration

All configuration is done via environment variables in `docker-compose.yml`:

### Keycloak Service
- **Admin Console**: http://localhost:8080/admin
  - Username: `admin`
  - Password: `admin`
- **Realm**: `toolhive`
- **Pre-configured client**: `toolhive-cloud-ui`

### Next.js App Service
Environment variables:
- `BETTER_AUTH_SECRET`: Auth session encryption key
- `BETTER_AUTH_URL`: Public URL of the app
- `TRUSTED_ORIGINS`: Allowed CORS origins
- `OIDC_ISSUER_URL`: Keycloak realm URL (internal container URL)
- `OIDC_CLIENT_ID`: OAuth client identifier
- `OIDC_CLIENT_SECRET`: OAuth client secret

## Test User

A test user is pre-created in Keycloak:
- **Username**: `test`
- **Email**: `test@example.com`
- **Password**: `test`
- **Name**: Test User

## Keycloak Admin Access

Access the Keycloak admin console to manage users, clients, and settings:

1. Open http://localhost:8080/admin
2. Log in with admin credentials (admin/admin)
3. Select the `toolhive` realm

## Customization

### Adding More Users

1. Access Keycloak admin console
2. Go to Users → Add User
3. Fill in user details
4. Go to Credentials tab and set a password

### Modifying Client Settings

1. Access Keycloak admin console
2. Go to Clients → `toolhive-cloud-ui`
3. Modify settings as needed
4. Remember to update redirect URIs if changing ports

### Changing Environment Variables

Edit `docker-compose.yml` and restart:
```bash
docker compose down
docker compose up --build
```

## Stopping the Stack

```bash
# Stop services
docker compose down

# Stop and remove volumes (resets Keycloak data)
docker compose down -v
```

## Troubleshooting

### Keycloak not starting
- Wait 30-60 seconds for Keycloak to initialize
- Check logs: `docker compose logs keycloak`

### App can't connect to Keycloak
- Ensure both containers are on the same network
- Check `OIDC_ISSUER_URL` uses container name: `http://keycloak:8080`

### Authentication redirects to wrong URL
- Browser uses `http://localhost:3002`
- Container uses `http://keycloak:8080` (internal)
- Ensure redirect URIs in Keycloak match `http://localhost:3002/api/auth/oauth2/callback/oidc`

## Production Deployment

For actual production deployment:

1. **Use a proper database** for Keycloak (PostgreSQL, MySQL)
2. **Enable HTTPS** with proper certificates
3. **Use strong secrets** - generate with `openssl rand -base64 32`
4. **Configure proper hostname** in Keycloak settings
5. **Remove dev mode** from Keycloak command
6. **Set up persistent volumes** for Keycloak data
7. **Configure proper CORS** origins
8. **Use Kubernetes/cloud services** instead of Docker Compose

## Differences from Development Mode

| Aspect | Development (`pnpm dev`) | Production-like (Docker) |
|--------|-------------------------|--------------------------|
| Identity Provider | Test OIDC provider | Keycloak |
| Authentication | Auto-login | Real login form |
| User Management | Hardcoded test user | Keycloak admin UI |
| Configuration | `.env.local` file | Environment variables |
| Build | Development mode | Production build |
| Performance | Slow (dev mode) | Fast (optimized) |

## Network Details

The Docker Compose setup creates an internal bridge network (`toolhive`):
- App and Keycloak communicate via container names
- External access via published ports (3000, 8080)
- Browser connects to `localhost`, app connects to `keycloak` hostname
