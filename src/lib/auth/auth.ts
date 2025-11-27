import type { Auth, BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { cookies } from "next/headers";
import {
  BASE_URL,
  BETTER_AUTH_SECRET,
  COOKIE_NAME,
  IS_PRODUCTION,
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
  OIDC_ISSUER_URL,
  OIDC_PROVIDER_ID,
  OIDC_SCOPES,
  TOKEN_SEVEN_DAYS_SECONDS,
  TRUSTED_ORIGINS,
} from "./constants";
import type { OIDCDiscovery, OidcTokenData, TokenResponse } from "./types";
import { decrypt, encrypt, saveAccountToken } from "./utils";

/**
 * Cached token endpoint to avoid repeated discovery calls.
 */
let cachedTokenEndpoint: string | null = null;

/**
 * Saves encrypted token data in HTTP-only cookie.
 * Exported for use by saveAccountToken in utils.
 */
export async function saveTokenCookie(tokenData: OidcTokenData): Promise<void> {
  const encrypted = await encrypt(tokenData, BETTER_AUTH_SECRET);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax",
    maxAge: TOKEN_SEVEN_DAYS_SECONDS,
    path: "/",
  });
}

/**
 * Discovers and caches the token endpoint from OIDC provider.
 */
async function getTokenEndpoint(): Promise<string | null> {
  if (cachedTokenEndpoint) {
    return cachedTokenEndpoint;
  }

  try {
    const discoveryUrl = `${OIDC_ISSUER_URL}/.well-known/openid-configuration`;
    const response = await fetch(discoveryUrl);

    if (!response.ok) {
      console.error(
        "[Auth] Failed to fetch OIDC discovery document:",
        response.status,
      );
      return null;
    }

    const discovery = (await response.json()) as OIDCDiscovery;
    cachedTokenEndpoint = discovery.token_endpoint;

    return cachedTokenEndpoint;
  } catch (error) {
    console.error("[Auth] Error fetching OIDC discovery document:", error);
    return null;
  }
}

/**
 * Attempts to refresh the access token using the refresh token.
 * Returns new token data if successful, null otherwise.
 */
export async function refreshAccessToken(
  refreshToken: string,
  userId: string,
  refreshTokenExpiresAt?: number,
): Promise<OidcTokenData | null> {
  if (!refreshToken || !userId) {
    console.error("[Auth] Missing refresh token or userId");
    return null;
  }

  // Check if refresh token is expired before attempting to refresh
  if (refreshTokenExpiresAt && refreshTokenExpiresAt <= Date.now()) {
    console.error("[Auth] Refresh token expired");
    return null;
  }

  try {
    const tokenEndpoint = await getTokenEndpoint();

    if (!tokenEndpoint) {
      console.error("[Auth] Token endpoint not available");
      return null;
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_CLIENT_SECRET,
    });

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error(
        "[Auth] Token refresh failed:",
        response.status,
        response.statusText,
      );
      return null;
    }

    const tokenResponse = (await response.json()) as TokenResponse;

    const expiresAt = Date.now() + tokenResponse.expires_in * 1000;
    const refreshTokenExpiresAt = tokenResponse.refresh_expires_in
      ? Date.now() + tokenResponse.refresh_expires_in * 1000
      : undefined;

    const newRefreshToken = tokenResponse.refresh_token || refreshToken;
    if (!tokenResponse.refresh_token) {
      console.warn(
        "[Auth] Provider did not return new refresh token, reusing existing",
      );
    }

    const newTokenData: OidcTokenData = {
      accessToken: tokenResponse.access_token,
      refreshToken: newRefreshToken,
      expiresAt,
      refreshTokenExpiresAt,
      userId,
    };

    // Save the new token data in the cookie
    await saveTokenCookie(newTokenData);

    console.log("[Auth] Token refreshed successfully");
    return newTokenData;
  } catch (error) {
    console.error("[Auth] Token refresh error:", error);
    return null;
  }
}

export const auth: Auth<BetterAuthOptions> = betterAuth({
  secret: BETTER_AUTH_SECRET,
  baseURL: BASE_URL,
  trustedOrigins: TRUSTED_ORIGINS,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: TOKEN_SEVEN_DAYS_SECONDS, // 7 days - match session duration!
    },
    // Session duration should match or exceed refresh token lifetime
    // This prevents Better Auth from logging out users before OIDC token refresh
    expiresIn: TOKEN_SEVEN_DAYS_SECONDS, // 7 days in seconds
    updateAge: 60 * 60 * 24, // Update session every 24 hours (in seconds)
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: OIDC_PROVIDER_ID,
          discoveryUrl: `${OIDC_ISSUER_URL}/.well-known/openid-configuration`,
          redirectURI: `${BASE_URL}/api/auth/oauth2/callback/${OIDC_PROVIDER_ID}`,
          clientId: OIDC_CLIENT_ID,
          clientSecret: OIDC_CLIENT_SECRET,
          scopes: OIDC_SCOPES,
          pkce: true,
        },
      ],
    }),
  ],
  // Use databaseHooks to save tokens in HTTP-only cookie after account creation/update
  databaseHooks: {
    account: {
      create: {
        after: saveAccountToken,
      },
      update: {
        after: saveAccountToken,
      },
    },
  },
});

/**
 * Retrieves the OIDC provider access token from HTTP-only cookie.
 * Returns null if token not found, expired, or belongs to different user.
 */
export async function getOidcProviderAccessToken(
  userId: string,
): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const encryptedCookie = cookieStore.get(COOKIE_NAME);

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

    const now = Date.now();

    if (tokenData.expiresAt <= now) {
      return null;
    }

    return tokenData.accessToken;
  } catch (error) {
    console.error("[Auth] Unexpected error reading OIDC token:", error);
    return null;
  }
}

/**
 * Clears the OIDC token cookie (useful for logout).
 */
export async function clearOidcProviderToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
