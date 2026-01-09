import { type Auth, type BetterAuthOptions, betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { cookies } from "next/headers";
import { Pool } from "pg";
import {
  BASE_URL,
  BETTER_AUTH_SECRET,
  DATABASE_URL,
  IS_PRODUCTION,
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
  OIDC_DISCOVERY_URL,
  OIDC_PROVIDER_ID,
  OIDC_SCOPES,
  OIDC_TOKEN_COOKIE_NAME,
  TOKEN_SEVEN_DAYS_SECONDS,
  TRUSTED_ORIGINS,
} from "./constants";
import { readTokenCookie, saveTokenCookie } from "./cookie";
import type {
  OidcDiscovery,
  OidcDiscoveryResponse,
  OidcTokenData,
  TokenResponse,
} from "./types";
import { getUserInfoFromIdToken, saveAccountToken } from "./utils";

// Re-export saveTokenCookie for backwards compatibility
export { saveTokenCookie } from "./cookie";

/**
 * Type declaration for the global pool singleton.
 * This allows TypeScript to understand the custom property on globalThis.
 */
declare global {
  // Using var is required for globalThis declarations
  // eslint-disable-next-line no-var
  var __authDbPool: Pool | null | undefined;
}

/**
 * Creates or retrieves the database pool singleton.
 * Uses globalThis to persist the pool across Next.js hot module reloads in development.
 * This prevents connection exhaustion from creating new pools on each reload.
 */
function getPool(): Pool | null {
  if (!DATABASE_URL) {
    return null;
  }

  // In development, reuse the pool across hot reloads
  if (globalThis.__authDbPool) {
    return globalThis.__authDbPool;
  }

  const newPool = new Pool({ connectionString: DATABASE_URL });
  globalThis.__authDbPool = newPool;
  console.log("[Auth] Created PostgreSQL connection pool for session storage");

  return newPool;
}

/**
 * Database pool for session storage (optional).
 * When DATABASE_URL is set (e.g., in docker-compose), sessions are stored in PostgreSQL.
 * This allows handling large OIDC tokens (like Azure AD with many groups) that exceed
 * the browser's 4KB cookie limit.
 * When DATABASE_URL is empty (e.g., pnpm dev), stateless cookie-based sessions are used.
 */
const pool = getPool();

if (pool) {
  console.log("[Auth] Using PostgreSQL for session storage");
} else {
  console.log("[Auth] Using stateless cookie-based sessions");
}

/**
 * Cached token endpoint to avoid repeated discovery calls.
 */
let cachedTokenEndpoint: string | null = null;
let cachedEndSessionEndpoint: string | null = null;

/**
 * Discovers and caches the token and end_session endpoints from OIDC provider.
 * Exported for use in server actions and token refresh logic.
 */
export async function getOidcDiscovery(): Promise<OidcDiscoveryResponse | null> {
  if (cachedTokenEndpoint) {
    return {
      tokenEndpoint: cachedTokenEndpoint,
      endSessionEndpoint: cachedEndSessionEndpoint,
    };
  }

  try {
    const response = await fetch(OIDC_DISCOVERY_URL);

    if (!response.ok) {
      console.error(
        "[Auth] Failed to fetch OIDC discovery document:",
        response.status,
      );
      return null;
    }

    const discovery = (await response.json()) as OidcDiscovery;
    cachedTokenEndpoint = discovery.token_endpoint;
    cachedEndSessionEndpoint = discovery.end_session_endpoint;

    return {
      tokenEndpoint: cachedTokenEndpoint,
      endSessionEndpoint: cachedEndSessionEndpoint,
    };
  } catch (error) {
    console.error("[Auth] Error fetching OIDC discovery document:", error);
    return null;
  }
}

/**
 * Attempts to refresh the access token using the refresh token.
 * Returns new token data if successful, null otherwise.
 */
export async function refreshAccessToken({
  refreshToken,
  userId,
  idToken: initialIdToken,
  refreshTokenExpiresAt: initialRefreshTokenExpiresAt,
}: {
  refreshToken: string;
  userId: string;
  refreshTokenExpiresAt?: number | undefined | null;
  idToken?: string | undefined | null;
}): Promise<OidcTokenData | null> {
  try {
    if (
      initialRefreshTokenExpiresAt &&
      initialRefreshTokenExpiresAt <= Date.now()
    ) {
      console.error("[Auth] Refresh token expired");
      return null;
    }

    const discovery = await getOidcDiscovery();

    if (!discovery) {
      console.error("[Auth] OIDC discovery not available");
      return null;
    }

    const { tokenEndpoint } = discovery;

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

    const tokenResponse: TokenResponse = await response.json();

    const accessTokenExpiresAt = Date.now() + tokenResponse.expires_in * 1000;
    const refreshTokenExpiresAt = tokenResponse.refresh_expires_in
      ? Date.now() + tokenResponse.refresh_expires_in * 1000
      : undefined;
    const idToken = tokenResponse.id_token ?? initialIdToken;
    const newRefreshToken = tokenResponse.refresh_token || refreshToken;
    if (!tokenResponse.refresh_token) {
      console.warn(
        "[Auth] Provider did not return new refresh token, reusing existing",
      );
    }

    const newTokenData: OidcTokenData = {
      accessToken: tokenResponse.access_token,
      refreshToken: newRefreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      userId,
      idToken,
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
  debug: !IS_PRODUCTION,
  secret: BETTER_AUTH_SECRET,
  baseURL: BASE_URL,
  // Use PostgreSQL if DATABASE_URL is set, otherwise stateless mode
  ...(pool && { database: pool }),
  account: {
    // When using database, store OAuth state in DB; otherwise use cookies
    storeStateStrategy: pool ? "database" : "cookie",
    // When using database, account data is stored in DB (handles large OIDC tokens)
    // When stateless (no DB), store in cookie (requires small OIDC tokens < 4KB)
    storeAccountCookie: !pool,
  },
  trustedOrigins: TRUSTED_ORIGINS,
  session: {
    cookieCache: {
      enabled: true,
      strategy: "jwe",
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
          discoveryUrl: OIDC_DISCOVERY_URL,
          redirectURI: `${BASE_URL}/api/auth/oauth2/callback/${OIDC_PROVIDER_ID}`,
          clientId: OIDC_CLIENT_ID,
          clientSecret: OIDC_CLIENT_SECRET,
          scopes: OIDC_SCOPES,
          pkce: true,
          // Custom getUserInfo to extract claims from ID token
          // Azure AD doesn't return email/upn from userinfo endpoint
          getUserInfo: async (tokens) => {
            const userInfo = getUserInfoFromIdToken(tokens.idToken);
            if (userInfo) {
              return userInfo;
            }
            // Fallback: return minimal info
            return {
              id: tokens.accessToken?.substring(0, 32) || "unknown",
              email: null,
              name: undefined,
              emailVerified: false,
            };
          },
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
    const tokenData = await readTokenCookie();

    if (!tokenData) {
      return null;
    }

    if (tokenData.userId !== userId) {
      console.error("[Auth] Token userId mismatch");
      return null;
    }

    const now = Date.now();

    if (
      tokenData.accessTokenExpiresAt &&
      tokenData.accessTokenExpiresAt <= now
    ) {
      return null;
    }

    return tokenData.accessToken || null;
  } catch (error) {
    console.error("[Auth] Unexpected error reading OIDC token:", error);
    return null;
  }
}

/**
 * Clears the OIDC token cookie (useful for logout).
 * Also clears any chunked cookies.
 */
export async function clearOidcProviderToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OIDC_TOKEN_COOKIE_NAME);
  // Also delete any chunked cookies
  for (let i = 0; i < 10; i++) {
    cookieStore.delete(`${OIDC_TOKEN_COOKIE_NAME}.${i}`);
  }
}
