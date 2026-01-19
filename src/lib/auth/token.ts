/**
 * OIDC Token Management
 *
 * Handles retrieval and refresh of OIDC access tokens.
 * Supports both database mode and stateless cookie mode.
 */

import { getOidcDiscovery, getOidcProviderAccessToken } from "./auth";
import {
  CLOCK_SKEW_BUFFER_MS,
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
} from "./constants";
import {
  getAccountForRefresh,
  isDatabaseMode,
  updateAccountTokens,
} from "./db";
import type { OidcTokenData, TokenResponse } from "./types";

// Token refresh threshold - refresh if expires within this time
export const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Public API
// ============================================================================

/**
 * Retrieves a valid OIDC access token for the current user.
 * Automatically attempts to refresh if the token is expired.
 * Returns null if unable to obtain a valid token.
 */
export async function getValidOidcToken(
  userId: string,
): Promise<string | null> {
  const existingToken = await getOidcProviderAccessToken(userId);
  if (existingToken) {
    return existingToken;
  }

  console.log("[Token] Access token expired or not found, attempting refresh");
  return refreshAccessToken(userId);
}

/**
 * Refreshes the access token.
 *
 * - Database mode: Refreshes token and updates the database.
 * - Cookie mode: Returns null. Token refresh is handled by the proxy (proxy.ts)
 *   BEFORE SSR starts. If we reach here with an expired token, the proxy failed
 *   and the user needs to re-authenticate.
 */
export async function refreshAccessToken(
  userId: string,
): Promise<string | null> {
  if (isDatabaseMode) {
    return refreshTokenFromDatabase(userId);
  }

  // Cookie mode: proxy.ts handles token refresh before SSR.
  // If we get here, the token is stale and user needs to re-login.
  console.log("[Token] Cookie mode - proxy should have refreshed token");
  return null;
}

/**
 * Checks if the token needs refresh (expired or expiring soon).
 */
export function needsRefresh(tokenData: OidcTokenData): boolean {
  const expiresAt = tokenData.accessTokenExpiresAt;
  const threshold = Date.now() + TOKEN_REFRESH_THRESHOLD_MS;
  return expiresAt <= threshold;
}

/**
 * Refreshes the access token using the OIDC provider.
 * Returns updated token data or null if refresh fails.
 * Used by proxy.ts for cookie mode refresh.
 */
export async function refreshTokenWithProvider(
  tokenData: OidcTokenData,
): Promise<OidcTokenData | null> {
  if (!tokenData.refreshToken) {
    console.log("[Token] No refresh token available");
    return null;
  }

  // Check if refresh token is expired
  if (
    tokenData.refreshTokenExpiresAt &&
    tokenData.refreshTokenExpiresAt <= Date.now()
  ) {
    console.log("[Token] Refresh token expired");
    return null;
  }

  const discovery = await getOidcDiscovery();
  if (!discovery?.tokenEndpoint) {
    console.error("[Token] Token endpoint not available");
    return null;
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokenData.refreshToken,
    client_id: OIDC_CLIENT_ID,
    client_secret: OIDC_CLIENT_SECRET,
  });

  try {
    const response = await fetch(discovery.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error("[Token] Refresh failed:", response.status);
      return null;
    }

    const tokenResponse: TokenResponse = await response.json();

    const newTokenData: OidcTokenData = {
      ...tokenData,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || tokenData.refreshToken,
      idToken: tokenResponse.id_token ?? tokenData.idToken,
      accessTokenExpiresAt:
        Date.now() + tokenResponse.expires_in * 1000 - CLOCK_SKEW_BUFFER_MS,
      refreshTokenExpiresAt: tokenResponse.refresh_expires_in
        ? Date.now() +
          tokenResponse.refresh_expires_in * 1000 -
          CLOCK_SKEW_BUFFER_MS
        : tokenData.refreshTokenExpiresAt,
    };

    console.log("[Token] Refreshed successfully");
    return newTokenData;
  } catch (error) {
    console.error("[Token] Refresh error:", error);
    return null;
  }
}

// ============================================================================
// Database Mode Refresh
// ============================================================================

async function refreshTokenFromDatabase(
  userId: string,
): Promise<string | null> {
  const account = await getAccountForRefresh(userId);

  if (!account) {
    return null;
  }

  if (!account.refreshToken) {
    console.error("[Token] No refresh token available");
    return null;
  }

  if (account.refreshTokenExpiresAt) {
    const expiresAt = new Date(account.refreshTokenExpiresAt).getTime();
    if (expiresAt <= Date.now()) {
      console.error("[Token] Refresh token expired");
      return null;
    }
  }

  const discovery = await getOidcDiscovery();
  if (!discovery?.tokenEndpoint) {
    console.error("[Token] Token endpoint not available");
    return null;
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: account.refreshToken,
    client_id: OIDC_CLIENT_ID,
    client_secret: OIDC_CLIENT_SECRET,
  });

  try {
    const response = await fetch(discovery.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error("[Token] Refresh failed:", response.status);
      return null;
    }

    const tokenResponse: TokenResponse = await response.json();

    const accessTokenExpiresAt = new Date(
      Date.now() + tokenResponse.expires_in * 1000 - CLOCK_SKEW_BUFFER_MS,
    );
    const refreshTokenExpiresAt = tokenResponse.refresh_expires_in
      ? new Date(
          Date.now() +
            tokenResponse.refresh_expires_in * 1000 -
            CLOCK_SKEW_BUFFER_MS,
        )
      : null;
    const idToken = tokenResponse.id_token ?? account.idToken;
    const newRefreshToken = tokenResponse.refresh_token || account.refreshToken;

    const updated = await updateAccountTokens(
      account.id,
      tokenResponse.access_token,
      newRefreshToken,
      idToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    );

    if (!updated) {
      console.error("[Token] Failed to update account tokens");
      return null;
    }

    console.log("[Token] Refreshed successfully (database mode)");
    return tokenResponse.access_token;
  } catch (error) {
    console.error("[Token] Refresh error:", error);
    return null;
  }
}
