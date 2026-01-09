/**
 * Utility functions for authentication and token management.
 */

import type { Account } from "better-auth";
import { TOKEN_ONE_HOUR_MS } from "./constants";
import { readTokenCookie, saveTokenCookie } from "./cookie";
import type { OidcTokenData, OidcUserInfo } from "./types";

// Re-export crypto functions for backwards compatibility
export { decrypt, encrypt, isOidcTokenData } from "./crypto";

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
    // JWT format: header.payload.signature
    const payload = idToken.split(".")[1];
    const decoded = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8"),
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
 *
 * @param account - Account data from Better Auth containing OIDC tokens
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
