/**
 * Utility functions for authentication and token management.
 */

import type { OidcUserInfo } from "./types";

// ============================================================================
// User Info Extraction (for Azure AD compatibility)
// ============================================================================

/**
 * Extracts user info from an OIDC ID token.
 * Decodes the JWT payload to get standard claims.
 * Handles Azure AD specific claims (preferred_username, upn) as fallbacks.
 */
export function getUserInfoFromIdToken(
  idToken: string | undefined,
): OidcUserInfo | null {
  if (!idToken) {
    return null;
  }

  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      console.error("[Auth] Invalid JWT format: expected 3 parts");
      return null;
    }

    const decoded = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8"),
    );

    // Standard OIDC claim, with Azure AD fallbacks
    const email =
      decoded.email ||
      decoded.preferred_username ||
      decoded.upn ||
      decoded.unique_name ||
      null;

    return {
      id: decoded.sub || decoded.oid,
      email,
      name: decoded.name || decoded.given_name,
      image: decoded.picture,
      emailVerified: decoded.email_verified || false,
    };
  } catch (error) {
    console.error("[Auth] Failed to decode ID token:", error);
    return null;
  }
}

/**
 * Fetches user info from the OIDC userinfo endpoint.
 * Discovers the userinfo URL from the OIDC discovery document.
 * Standard OIDC flow for providers that don't include claims in the ID token.
 */
async function fetchUserInfoFromEndpoint(
  accessToken: string | undefined,
  discoveryUrl: string,
): Promise<OidcUserInfo | null> {
  if (!accessToken) {
    return null;
  }

  try {
    const discoveryResponse = await fetch(discoveryUrl);
    if (!discoveryResponse.ok) {
      console.error("[Auth] Discovery fetch failed:", discoveryResponse.status);
      return null;
    }

    const discovery = await discoveryResponse.json();
    const userinfoUrl = discovery.userinfo_endpoint;

    if (!userinfoUrl) {
      console.error("[Auth] No userinfo_endpoint in discovery document");
      return null;
    }

    const response = await fetch(userinfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error("[Auth] Userinfo endpoint failed:", response.status);
      return null;
    }

    const data = await response.json();

    return {
      id: data.sub,
      email: data.email || null,
      name: data.name,
      image: data.picture,
      emailVerified: data.email_verified ?? false,
    };
  } catch (error) {
    console.error("[Auth] Failed to fetch userinfo:", error);
    return null;
  }
}

/**
 * Gets user info from OIDC tokens with fallback strategy.
 * 1. Try ID token first (works for Azure AD)
 * 2. Fallback to userinfo endpoint (standard OIDC)
 */
export async function getUserInfoFromTokens(
  tokens: { idToken?: string; accessToken?: string },
  discoveryUrl: string,
): Promise<OidcUserInfo | null> {
  const fromIdToken = getUserInfoFromIdToken(tokens.idToken);
  if (fromIdToken?.email) {
    return fromIdToken;
  }

  const fromEndpoint = await fetchUserInfoFromEndpoint(
    tokens.accessToken,
    discoveryUrl,
  );
  if (fromEndpoint) {
    return fromEndpoint;
  }

  return null;
}
