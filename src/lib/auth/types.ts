/**
 * Authentication types and interfaces for OIDC token management.
 */

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

export interface OidcDiscoveryResponse {
  tokenEndpoint: string | null;
  endSessionEndpoint: string | null;
}

/**
 * User info extracted from OIDC ID token.
 * Used by genericOAuth getUserInfo callback.
 */
export interface OidcUserInfo {
  id: string;
  email: string | null;
  name: string | undefined;
  image: string | undefined;
  emailVerified: boolean;
}
