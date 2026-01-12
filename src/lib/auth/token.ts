/**
 * OIDC Token Management
 *
 * Handles retrieval and refresh of OIDC access tokens.
 * Supports both database mode and stateless cookie mode.
 */

"use server";

import { getOidcDiscovery, getOidcProviderAccessToken } from "./auth";
import {
  CLOCK_SKEW_BUFFER_MS,
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
} from "./constants";
import {
  clearTokenCookie,
  getTokenFromCookie,
  saveTokenCookie,
} from "./cookie";
import {
  getAccountForRefresh,
  isDatabaseMode,
  updateAccountTokens,
} from "./db";
import type { OidcTokenData, TokenResponse } from "./types";

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
 * Uses database if available, otherwise falls back to cookie.
 */
export async function refreshAccessToken(
  userId: string,
): Promise<string | null> {
  if (isDatabaseMode) {
    return refreshTokenFromDatabase(userId);
  }
  return refreshTokenFromCookie(userId);
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

// ============================================================================
// Cookie Mode Refresh
// ============================================================================

async function refreshTokenFromCookie(userId: string): Promise<string | null> {
  const tokenData = await getTokenFromCookie(userId);

  if (!tokenData?.refreshToken) {
    console.error("[Token] No refresh token in cookie");
    return null;
  }

  if (
    tokenData.refreshTokenExpiresAt &&
    tokenData.refreshTokenExpiresAt <= Date.now()
  ) {
    console.error("[Token] Refresh token expired (cookie mode)");
    await clearTokenCookie();
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
      await clearTokenCookie();
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

    await saveTokenCookie(newTokenData);
    console.log("[Token] Refreshed successfully (cookie mode)");
    return tokenResponse.access_token;
  } catch (error) {
    console.error("[Token] Refresh error:", error);
    return null;
  }
}
