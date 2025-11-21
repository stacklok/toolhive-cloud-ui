/**
 * Authentication types and interfaces for OIDC token management.
 */

/**
 * Represents the data stored in the encrypted OIDC token cookie.
 */
export interface OidcTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  refreshTokenExpiresAt?: number;
  userId: string;
}

/**
 * OIDC Discovery Document structure.
 * Retrieved from /.well-known/openid-configuration endpoint.
 */
export interface OIDCDiscovery {
  token_endpoint: string;
  [key: string]: unknown;
}

/**
 * OIDC Token Response from the provider's token endpoint.
 * Returned when exchanging authorization code or refreshing tokens.
 */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
}
