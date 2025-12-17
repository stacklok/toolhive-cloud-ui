/**
 * Cookie utilities for OIDC token storage.
 * Separated to avoid circular dependencies with auth modules.
 */

import { cookies } from "next/headers";
import {
  BETTER_AUTH_SECRET,
  IS_PRODUCTION,
  OIDC_TOKEN_COOKIE_NAME,
  TOKEN_SEVEN_DAYS_SECONDS,
} from "./constants";
import { encrypt } from "./crypto";
import type { OidcTokenData } from "./types";

/**
 * Saves encrypted token data in HTTP-only cookie.
 * Used by saveAccountToken in utils and refreshAccessToken in auth.
 */
export async function saveTokenCookie(tokenData: OidcTokenData): Promise<void> {
  const encrypted = await encrypt(tokenData, BETTER_AUTH_SECRET);
  const cookieStore = await cookies();

  cookieStore.set(OIDC_TOKEN_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    maxAge: TOKEN_SEVEN_DAYS_SECONDS,
    path: "/",
  });
}
