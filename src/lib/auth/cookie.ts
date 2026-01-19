/**
 * Cookie utilities for OIDC token storage in stateless mode.
 * Aligned with Better Auth's cookie chunking implementation.
 * Used when DATABASE_URL is not configured.
 *
 * Provides two sets of functions:
 * - Server Component/Action functions using next/headers cookies()
 * - Proxy functions using NextRequest/NextResponse for middleware-like operations
 */

import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import {
  BETTER_AUTH_SECRET,
  COOKIE_SECURE,
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
 */
export async function saveTokenCookie(tokenData: OidcTokenData): Promise<void> {
  const encrypted = await encrypt(tokenData, BETTER_AUTH_SECRET);
  const cookieStore = await cookies();
  const encryptedSize = encrypted.length;

  const cookieOptions = {
    httpOnly: true,
    secure: COOKIE_SECURE,
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
 * Supports both single cookie and chunked cookies.
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

/**
 * Retrieves token data with userId validation.
 * Returns null if cookie not found, decryption fails, or userId mismatch.
 */
export async function getTokenFromCookie(
  userId: string,
): Promise<OidcTokenData | null> {
  const tokenData = await readTokenCookie();

  if (!tokenData) {
    return null;
  }

  if (tokenData.userId !== userId) {
    console.error("[Cookie] Token userId mismatch");
    return null;
  }

  return tokenData;
}

// ============================================================================
// Proxy Functions (NextRequest/NextResponse)
// Used by proxy.ts which runs before SSR and can modify response cookies
// ============================================================================

/**
 * Reads and reassembles encrypted token from request cookies.
 * Returns the raw encrypted JWE string for decryption.
 */
export function readTokenFromRequest(request: NextRequest): string | null {
  // First, try to read single (non-chunked) cookie
  const singleCookie = request.cookies.get(OIDC_TOKEN_COOKIE_NAME);
  if (singleCookie?.value) {
    return singleCookie.value;
  }

  // Look for chunked cookies: cookie_name.0, cookie_name.1, etc.
  const chunks: Array<{ index: number; value: string }> = [];

  for (const cookie of request.cookies.getAll()) {
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
  return chunks.map((c) => c.value).join("");
}

/**
 * Sets encrypted token cookie(s) on the response, chunking if necessary.
 */
export function setTokenCookiesOnResponse(
  response: NextResponse,
  encrypted: string,
): void {
  const cookieOptions = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax" as const,
    maxAge: TOKEN_SEVEN_DAYS_SECONDS,
    path: "/",
  };

  const chunkCount = Math.ceil(encrypted.length / CHUNK_SIZE);

  if (chunkCount === 1) {
    response.cookies.set(OIDC_TOKEN_COOKIE_NAME, encrypted, cookieOptions);
  } else {
    // Split into chunks
    for (let i = 0; i < chunkCount; i++) {
      const start = i * CHUNK_SIZE;
      const chunkValue = encrypted.substring(start, start + CHUNK_SIZE);
      response.cookies.set(
        `${OIDC_TOKEN_COOKIE_NAME}.${i}`,
        chunkValue,
        cookieOptions,
      );
    }
  }
}

/**
 * Clears all OIDC token cookies from the response.
 */
export function clearTokenCookiesOnResponse(
  response: NextResponse,
  request: NextRequest,
): void {
  response.cookies.delete(OIDC_TOKEN_COOKIE_NAME);

  // Clear any chunked cookies
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith(`${OIDC_TOKEN_COOKIE_NAME}.`)) {
      response.cookies.delete(cookie.name);
    }
  }
}

/**
 * Decrypts token data from encrypted JWE string.
 * Returns null if decryption fails.
 */
export async function decryptTokenData(
  encrypted: string,
): Promise<OidcTokenData | null> {
  try {
    return await decrypt(encrypted, BETTER_AUTH_SECRET);
  } catch {
    return null;
  }
}

/**
 * Encrypts token data to JWE string for cookie storage.
 */
export async function encryptTokenData(data: OidcTokenData): Promise<string> {
  return await encrypt(data, BETTER_AUTH_SECRET);
}
