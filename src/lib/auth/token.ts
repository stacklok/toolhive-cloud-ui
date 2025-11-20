/**
 * OIDC Token Management
 *
 * Handles retrieval and refresh of OIDC access tokens.
 */

"use server";

import { headers as nextHeaders } from "next/headers";
import { getOidcProviderAccessToken } from "./auth";

/**
 * Refreshes an expired OIDC access token by requesting a new one from the server.
 * Returns the new access token if successful, null otherwise.
 */
async function refreshOidcAccessToken(userId: string): Promise<string | null> {
  try {
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
    const headers = await nextHeaders();
    const cookieHeader = headers.get("cookie") || "";

    const response = await fetch(`${baseUrl}/api/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ userId }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[Token] Refresh failed:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.success && data.accessToken) {
      return data.accessToken;
    }

    return null;
  } catch (error) {
    console.error("[Token] Refresh error:", error);
    return null;
  }
}

/**
 * Retrieves a valid OIDC access token for the current user.
 * Automatically attempts to refresh if the token is expired.
 * Returns null if unable to obtain a valid token.
 */
export async function getValidOidcToken(
  userId: string,
): Promise<string | null> {
  // Try to get existing token
  const existingToken = await getOidcProviderAccessToken(userId);
  if (existingToken) {
    return existingToken;
  }

  // Token expired or not found, try to refresh
  return refreshOidcAccessToken(userId);
}
