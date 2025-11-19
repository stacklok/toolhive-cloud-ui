import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { cookies } from "next/headers";
import type { OIDCDiscovery, OidcTokenData, TokenResponse } from "./types";
import { decrypt, encrypt } from "./utils";

// Environment configuration
const OIDC_PROVIDER_ID = process.env.OIDC_PROVIDER_ID || "oidc";
const OIDC_ISSUER_URL = process.env.OIDC_ISSUER_URL || "";
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || "";
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || "";
const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const BETTER_AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET || "build-time-better-auth-secret";

// Token expiration constants
const TOKEN_ONE_HOUR_MS = 60 * 60 * 1000; //  1 hour in ms
const TOKEN_SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

// Cookie configuration
const COOKIE_NAME = "oidc_token" as const;

const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",").map((s) => s.trim())
  : [BASE_URL, "http://localhost:3002", "http://localhost:3003"];

if (!trustedOrigins.includes(BASE_URL)) {
  trustedOrigins.push(BASE_URL);
}

/**
 * Cached token endpoint to avoid repeated discovery calls.
 */
let cachedTokenEndpoint: string | null = null;

/**
 * Saves encrypted token data in HTTP-only cookie.
 */
async function saveTokenCookie(tokenData: OidcTokenData): Promise<void> {
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
    const discoveryUrl = `${OIDC_ISSUER}/.well-known/openid-configuration`;
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
async function refreshAccessToken(
  refreshToken: string,
  userId: string,
): Promise<OidcTokenData | null> {
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

    const newTokenData: OidcTokenData = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || refreshToken,
      expiresAt,
      refreshTokenExpiresAt,
      userId,
    };

    // Save the new token data in the cookie
    await saveTokenCookie(newTokenData);

    return newTokenData;
  } catch (error) {
    console.error("[Auth] Token refresh error:", error);
    return null;
  }
}

export const auth = betterAuth({
  secret: BETTER_AUTH_SECRET,
  baseURL: BASE_URL,
  trustedOrigins,
  session: {
    cookieCache: {
      enabled: true,
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: OIDC_PROVIDER_ID,
          discoveryUrl: `${OIDC_ISSUER_URL}/.well-known/openid-configuration`,
          redirectURI: `${BASE_URL}/api/auth/oauth2/callback/${OIDC_PROVIDER_ID}`,
          clientId: process.env.OIDC_CLIENT_ID || "",
          clientSecret: process.env.OIDC_CLIENT_SECRET || "",
          scopes: ["openid", "email", "profile"],
          pkce: true,
        },
      ],
    }),
  ],
  // Use databaseHooks to save tokens in HTTP-only cookie after account creation
  databaseHooks: {
    account: {
      create: {
        after: async (account: {
          accessToken?: string;
          refreshToken?: string;
          accessTokenExpiresAt?: Date | string;
          refreshTokenExpiresAt?: Date | string;
          userId: string;
        }) => {
          if (account.accessToken && account.userId) {
            const expiresAt = account.accessTokenExpiresAt
              ? new Date(account.accessTokenExpiresAt).getTime()
              : Date.now() + TOKEN_ONE_HOUR_MS;

            const refreshTokenExpiresAt = account.refreshTokenExpiresAt
              ? new Date(account.refreshTokenExpiresAt).getTime()
              : undefined;

            const tokenData: OidcTokenData = {
              accessToken: account.accessToken,
              refreshToken: account.refreshToken || undefined,
              expiresAt,
              refreshTokenExpiresAt,
              userId: account.userId,
            };

            await saveTokenCookie(tokenData);
          }
        },
      },
    },
  },
} as BetterAuthOptions);

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
      // Decryption failure indicates tampering, corruption, or wrong secret
      console.error(
        "[Auth] Token decryption failed - possible tampering or invalid format:",
        error,
      );
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    if (tokenData.userId !== userId) {
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    const now = Date.now();
    if (tokenData.expiresAt <= now) {
      // Check if refresh token is also expired
      if (
        tokenData.refreshTokenExpiresAt &&
        tokenData.refreshTokenExpiresAt <= now
      ) {
        console.log("[Auth] Both access and refresh tokens expired");
        cookieStore.delete(COOKIE_NAME);
        return null;
      }

      // Attempt to refresh the token if refresh token is available
      if (tokenData.refreshToken) {
        console.log("[Auth] Access token expired, attempting refresh...");
        const refreshedData = await refreshAccessToken(
          tokenData.refreshToken,
          userId,
        );

        if (refreshedData) {
          console.log("[Auth] Token refresh successful");
          return refreshedData.accessToken;
        }

        console.log("[Auth] Token refresh failed, clearing cookie");
      }

      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    return tokenData.accessToken;
  } catch (error) {
    // Unexpected error (e.g., cookie operations failure)
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
