/**
 * Authentication types and interfaces for OIDC token management.
 */

import type { Account } from "better-auth";

/**
 * Represents the data stored in the encrypted OIDC token cookie.
 */
export interface OidcTokenData
  extends Omit<
    Account,
    | "accessTokenExpiresAt"
    | "accountId"
    | "providerId"
    | "refreshTokenExpiresAt"
    | "createdAt"
    | "updatedAt"
    | "id"
  > {
  accessTokenExpiresAt: number;
  refreshTokenExpiresAt?: number;
  providerId?: string;
  accountId?: string;
  updatedAt?: Date;
  createdAt?: Date;
  id?: string;
}

/**
 * OIDC Discovery Document structure.
 * Retrieved from /.well-known/openid-configuration endpoint.
 */
export interface OidcDiscovery {
  token_endpoint: string;
  end_session_endpoint: string;
  issuer: string;
  authorization_endpoint: string;
  userinfo_endpoint: string;
  registration_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  response_modes_supported: string[];
  grant_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  scopes_supported: string[];
  claims_supported: string[];
  code_challenge_methods_supported: string[];
  token_endpoint_auth_methods_supported: string[];
  request_object_signing_alg_values_supported: string[];
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
  id_token?: string;
}

export interface OidcDiscoveryResponse {
  tokenEndpoint: string | null;
  endSessionEndpoint: string | null;
}
