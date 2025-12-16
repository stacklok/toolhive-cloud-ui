/**
 * Utility functions for authentication and token management.
 */

import type { Account } from "better-auth";
import { cookies } from "next/headers";
import {
  BETTER_AUTH_SECRET,
  OIDC_TOKEN_COOKIE_NAME,
  TOKEN_ONE_HOUR_MS,
} from "./constants";
import { saveTokenCookie } from "./cookie";
import { decrypt } from "./crypto";
import type { OidcTokenData } from "./types";

// Re-export crypto functions for backwards compatibility
export { decrypt, encrypt, isOidcTokenData } from "./crypto";

/**
 * Retrieves the OIDC ID token from HTTP-only cookie.
 * Returns null if token not found or belongs to different user.
 * Used for OIDC logout (RP-Initiated Logout).
 */
export async function getOidcIdToken(userId: string): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const encryptedCookie = cookieStore.get(OIDC_TOKEN_COOKIE_NAME);

    if (!encryptedCookie?.value) {
      return null;
    }

    let tokenData: OidcTokenData;
    try {
      tokenData = await decrypt(encryptedCookie.value, BETTER_AUTH_SECRET);
    } catch (error) {
      console.error("[Auth] Token decryption failed:", error);
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
      ...account,
      accessToken: account.accessToken,
      refreshToken: account.refreshToken || undefined,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      userId: account.userId,
    };

    await saveTokenCookie(tokenData);

    console.log("[Save Token] Token cookie saved successfully");
  } else {
    console.warn(
      "[Save Token] Missing accessToken or userId, not saving token",
    );
  }
}
