/**
 * OIDC Provider ID used throughout the application.
 * This value must match the providerId configured in Better Auth
 * and the callback URL pattern: /api/auth/oauth2/callback/{OIDC_PROVIDER_ID}
 */
export const OIDC_PROVIDER_ID = "oidc" as const;
