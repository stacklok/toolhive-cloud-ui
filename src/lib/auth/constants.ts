/**
 * Authentication constants and configuration.
 */

// Environment configuration
export const OIDC_PROVIDER_ID = process.env.OIDC_PROVIDER_ID || "oidc";
export const OIDC_ISSUER_URL = process.env.OIDC_ISSUER_URL || "";
export const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || "";
export const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || "";
export const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || "build-time-better-auth-secret";

// Token expiration constants (in milliseconds and seconds)
export const TOKEN_ONE_HOUR_MS = 60 * 60 * 1000; // 3,600,000 ms (1 hour)
export const TOKEN_SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60; // 604,800 seconds (7 days)

// Cookie configuration
export const COOKIE_NAME = "oidc_token" as const;

// Trusted origins for Better Auth
const trustedOriginsFromEnv = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",").map((s) => s.trim())
  : [BASE_URL, "http://localhost:3002", "http://localhost:3003"];

// Ensure BASE_URL is always included in trusted origins
export const TRUSTED_ORIGINS = trustedOriginsFromEnv.includes(BASE_URL)
  ? trustedOriginsFromEnv
  : [...trustedOriginsFromEnv, BASE_URL];
