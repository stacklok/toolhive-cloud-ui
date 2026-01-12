/**
 * Utility functions for authentication and token management.
 */

import type { Account } from "better-auth";
import { TOKEN_ONE_HOUR_MS } from "./constants";
import { readTokenCookie, saveTokenCookie } from "./cookie";
import type { OidcTokenData, OidcUserInfo } from "./types";

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
export async function fetchUserInfoFromEndpoint(
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

// ============================================================================
// Token Access Functions
// ============================================================================

/**
 * Retrieves the OIDC ID token from HTTP-only cookie.
 * Returns null if token not found or belongs to different user.
 * Used for OIDC logout (RP-Initiated Logout).
 */
export async function getOidcIdToken(userId: string): Promise<string | null> {
  try {
    const tokenData = await readTokenCookie();

    if (!tokenData) {
      return null;
    }

    if (tokenData.userId !== userId) {
      console.error("[Auth] Token userId mismatch");
      return null;
    }

    return tokenData.idToken || null;
  } catch (error) {
    console.error("[Auth] Unexpected error reading OIDC ID token:", error);
    return null;
  }
}

/**
 * Saves OIDC tokens from account creation or update into HTTP-only cookie.
 * Used by Better Auth database hooks for both initial login and re-login.
 */
export async function saveAccountToken(account: Account) {
  if (account.accessToken && account.userId) {
    const accessTokenExpiresAt = account.accessTokenExpiresAt
      ? new Date(account.accessTokenExpiresAt).getTime()
      : Date.now() + TOKEN_ONE_HOUR_MS;

    const refreshTokenExpiresAt = account.refreshTokenExpiresAt
      ? new Date(account.refreshTokenExpiresAt).getTime()
      : undefined;

    const tokenData: OidcTokenData = {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken || undefined,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      userId: account.userId,
    };

    await saveTokenCookie(tokenData);
  }
}

export {
  clearOidcProviderToken,
  getTokenFromCookie,
  readTokenCookie,
  saveTokenCookie,
} from "./cookie";
// Re-export for convenience
export { decrypt, encrypt, isOidcTokenData } from "./crypto";
