/**
 * Cookie utilities for OIDC token storage.
 * Aligned with Better Auth's cookie chunking implementation.
 */

import { cookies } from "next/headers";
import {
  BETTER_AUTH_SECRET,
  IS_PRODUCTION,
  OIDC_TOKEN_COOKIE_NAME,
  TOKEN_SEVEN_DAYS_SECONDS,
} from "./constants";
import { decrypt, encrypt } from "./crypto";
import type { OidcTokenData } from "./types";

// Cookie size limits (aligned with Better Auth)
const ALLOWED_COOKIE_SIZE = 4096;
const ESTIMATED_EMPTY_COOKIE_SIZE = 200;
const CHUNK_SIZE = ALLOWED_COOKIE_SIZE - ESTIMATED_EMPTY_COOKIE_SIZE;

/**
 * Get chunk index from cookie name (e.g., "oidc_token.2" -> 2)
 */
function getChunkIndex(cookieName: string): number {
  const parts = cookieName.split(".");
  const lastPart = parts[parts.length - 1];
  const index = Number.parseInt(lastPart || "0", 10);
  return Number.isNaN(index) ? 0 : index;
}

/**
 * Clears the OIDC token cookie and all chunked cookies.
 * Used for logout and cleanup before saving new tokens.
 */
export async function clearOidcProviderToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OIDC_TOKEN_COOKIE_NAME);

  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith(`${OIDC_TOKEN_COOKIE_NAME}.`)) {
      cookieStore.delete(cookie.name);
    }
  }
}

/**
 * Saves encrypted token data in HTTP-only cookies.
 * Automatically chunks data across multiple cookies if too large.
 * Uses same chunking pattern as Better Auth: cookie_name.0, cookie_name.1, etc.
 */
export async function saveTokenCookie(tokenData: OidcTokenData): Promise<void> {
  const encrypted = await encrypt(tokenData, BETTER_AUTH_SECRET);
  const cookieStore = await cookies();
  const encryptedSize = encrypted.length;

  const cookieOptions = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax" as const,
    maxAge: TOKEN_SEVEN_DAYS_SECONDS,
    path: "/",
  };

  try {
    // Clean up any existing cookies (main + chunks)
    await clearOidcProviderToken();

    const chunkCount = Math.ceil(encryptedSize / CHUNK_SIZE);

    if (chunkCount === 1) {
      // Single cookie is enough
      cookieStore.set(OIDC_TOKEN_COOKIE_NAME, encrypted, cookieOptions);
    } else {
      // Split into chunks: cookie_name.0, cookie_name.1, etc.
      for (let i = 0; i < chunkCount; i++) {
        const start = i * CHUNK_SIZE;
        const chunkValue = encrypted.substring(start, start + CHUNK_SIZE);
        cookieStore.set(
          `${OIDC_TOKEN_COOKIE_NAME}.${i}`,
          chunkValue,
          cookieOptions,
        );
      }
    }
  } catch (error) {
    console.error("[Cookie] Error setting cookie:", error);
  }
}

/**
 * Reads and reassembles token data from chunked cookies.
 * Supports both single cookie and chunked cookies (cookie_name.0, cookie_name.1, etc.)
 */
export async function readTokenCookie(): Promise<OidcTokenData | null> {
  try {
    const cookieStore = await cookies();

    // First, try to read single (non-chunked) cookie
    const singleCookie = cookieStore.get(OIDC_TOKEN_COOKIE_NAME);
    if (singleCookie?.value) {
      return await decrypt(singleCookie.value, BETTER_AUTH_SECRET);
    }

    // Look for chunked cookies: cookie_name.0, cookie_name.1, etc.
    const chunks: Array<{ index: number; value: string }> = [];
    const allCookies = cookieStore.getAll();

    for (const cookie of allCookies) {
      if (cookie.name.startsWith(`${OIDC_TOKEN_COOKIE_NAME}.`)) {
        const index = getChunkIndex(cookie.name);
        chunks.push({ index, value: cookie.value });
      }
    }

    if (chunks.length === 0) {
      return null;
    }

    // Sort by index and join
    chunks.sort((a, b) => a.index - b.index);
    const encrypted = chunks.map((c) => c.value).join("");

    return await decrypt(encrypted, BETTER_AUTH_SECRET);
  } catch (error) {
    console.error("[Cookie] Error reading token cookie:", error);
    return null;
  }
}
