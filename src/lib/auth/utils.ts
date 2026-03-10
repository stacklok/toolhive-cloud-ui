/**
 * Utility functions for authentication and token management.
 */

import { symmetricDecodeJWT } from "better-auth/crypto";
import { cookies } from "next/headers";
import { BETTER_AUTH_SECRET } from "./constants";
import type { OidcUserInfo } from "./types";

// ============================================================================
// Token Expiry Check (for Server Component context)
// ============================================================================

/**
 * Checks whether the stored OIDC access token is near expiry.
 *
 * Decodes the Better Auth `account_data` JWE cookie to read `accessTokenExpiresAt`
 * and returns `true` if the token expires within the given margin.
 *
 * Used by `getAuthenticatedClient()` in Server Component context to decide
 * whether to preemptively redirect to `/api/auth/token-refresh` before Better
 * Auth's 5-second refresh threshold is reached. This ensures the rotated
 * refresh token (R2) is saved properly — Server Components cannot write cookies,
 * so the refresh + cookie save must happen in a Route Handler.
 *
 * @param marginMs - How far in advance to consider the token "near expiry" (default 10s).
 *   Must be greater than Better Auth's internal 5s refresh threshold, and less than the
 *   OIDC provider's access token TTL (e.g. 15s in dev, 3600s in production).
 * @returns `true` if the token is near expiry, expired, or the cookie cannot be decoded
 */
export async function isTokenNearExpiry(marginMs = 10_000): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Better Auth may chunk large cookies as account_data.0, account_data.1, etc.
    const chunks = allCookies
      .filter(
        (c) =>
          c.name === "better-auth.account_data" ||
          c.name.startsWith("better-auth.account_data."),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => c.value)
      .join("");

    if (!chunks) return true; // No cookie → treat as expired

    const decoded = await symmetricDecodeJWT(
      chunks,
      BETTER_AUTH_SECRET,
      "better-auth-account",
    );

    if (!decoded || typeof decoded !== "object") return true;

    const account = decoded as Record<string, unknown>;
    if (!account.accessTokenExpiresAt) return true;

    const expiresAt = new Date(
      account.accessTokenExpiresAt as string,
    ).getTime();
    return expiresAt - Date.now() < marginMs;
  } catch {
    // JWE decode failed (corrupted cookie, secret mismatch, etc.)
    // Treat as near-expiry so the Route Handler re-establishes a valid state.
    return true;
  }
}

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
