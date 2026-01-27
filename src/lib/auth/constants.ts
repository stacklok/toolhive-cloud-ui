/**
 * Authentication constants and configuration.
 */

// Environment configuration
/**
 * OIDC Provider ID (e.g., "oidc", "okta")
 * Server-side only - not exposed to the client.
 */
export const OIDC_PROVIDER_ID = process.env.OIDC_PROVIDER_ID || "oidc";
const OIDC_ISSUER_URL = process.env.OIDC_ISSUER_URL || "";
export const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || "";
export const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || "";
export const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const OIDC_DISCOVERY_URL = `${OIDC_ISSUER_URL}/.well-known/openid-configuration`;
export const BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || "build-time-better-auth-secret";
export const OIDC_SCOPES = process.env.OIDC_SCOPES?.split(",") ?? [
  "openid",
  "email",
  "profile",
  "offline_access",
];

// Token expiration constants (in milliseconds and seconds)
export const TOKEN_ONE_HOUR_MS = 60 * 60 * 1000; // 3,600,000 ms (1 hour)
export const TOKEN_SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60; // 604,800 seconds (7 days)

/**
 * Buffer time subtracted from token expiration to account for clock skew
 * between our server and the OIDC provider. Prevents edge cases where
 * tokens appear valid locally but are rejected by the provider.
 */
export const CLOCK_SKEW_BUFFER_MS = 60 * 1000; // 60 seconds

// Cookie configuration (used for stateless mode when DATABASE_URL is not set)
export const OIDC_TOKEN_COOKIE_NAME = "oidc_token" as const;

/**
 * Whether to use secure cookies (HTTPS only).
 * Set COOKIE_SECURE=false for local development over HTTP.
 * Defaults to true in production, false otherwise.
 */
export const COOKIE_SECURE =
  process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === "true"
    : IS_PRODUCTION;

// Database configuration (optional - enables database mode for large OIDC tokens)
export const DATABASE_URL = process.env.DATABASE_URL;

// Rate limiting configuration
// Default is 3 requests per 10 seconds for sign-in endpoints (Better Auth default)
// Set BETTER_AUTH_RATE_LIMIT to a higher value (e.g., 100) for E2E tests
export const BETTER_AUTH_RATE_LIMIT = process.env.BETTER_AUTH_RATE_LIMIT
  ? Number.parseInt(process.env.BETTER_AUTH_RATE_LIMIT, 10)
  : undefined;

// Trusted origins for Better Auth
const trustedOriginsFromEnv = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",").map((s) => s.trim())
  : [BASE_URL, "http://localhost:3002", "http://localhost:3003"];

// Ensure BASE_URL is always included in trusted origins
export const TRUSTED_ORIGINS = trustedOriginsFromEnv.includes(BASE_URL)
  ? trustedOriginsFromEnv
  : [...trustedOriginsFromEnv, BASE_URL];
