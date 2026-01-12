import type { Account } from "better-auth";
import { type Auth, type BetterAuthOptions, betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import {
  BASE_URL,
  BETTER_AUTH_SECRET,
  IS_PRODUCTION,
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
  OIDC_DISCOVERY_URL,
  OIDC_PROVIDER_ID,
  OIDC_SCOPES,
  TOKEN_ONE_HOUR_MS,
  TOKEN_SEVEN_DAYS_SECONDS,
  TRUSTED_ORIGINS,
} from "./constants";
import { getTokenFromCookie, saveTokenCookie } from "./cookie";
import {
  getIdTokenFromDatabase,
  getTokenFromDatabase,
  isDatabaseMode,
  pool,
} from "./db";
import type {
  OidcDiscovery,
  OidcDiscoveryResponse,
  OidcTokenData,
} from "./types";
import { getUserInfoFromTokens } from "./utils";

/**
 * Cached OIDC discovery endpoints.
 */
let cachedTokenEndpoint: string | null = null;
let cachedEndSessionEndpoint: string | null = null;

/**
 * Discovers and caches the token and end_session endpoints from OIDC provider.
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

// ============================================================================
// Token Access Functions
// ============================================================================

/**
 * Retrieves the OIDC provider access token.
 * Uses database if available, otherwise falls back to cookie.
 */
export async function getOidcProviderAccessToken(
  userId: string,
): Promise<string | null> {
  if (isDatabaseMode) {
    return getTokenFromDatabase(userId);
  }
  return getTokenFromCookieMode(userId);
}

/**
 * Retrieves the OIDC ID token for logout.
 * Uses database if available, otherwise falls back to cookie.
 */
export async function getOidcIdToken(userId: string): Promise<string | null> {
  if (isDatabaseMode) {
    return getIdTokenFromDatabase(userId);
  }
  return getIdTokenFromCookie(userId);
}

// Cookie mode helpers
async function getTokenFromCookieMode(userId: string): Promise<string | null> {
  const tokenData = await getTokenFromCookie(userId);
  if (!tokenData?.accessToken) {
    return null;
  }

  if (
    tokenData.accessTokenExpiresAt &&
    tokenData.accessTokenExpiresAt <= Date.now()
  ) {
    console.log("[Auth] Access token expired (cookie mode)");
    return null;
  }

  return tokenData.accessToken;
}

async function getIdTokenFromCookie(userId: string): Promise<string | null> {
  const tokenData = await getTokenFromCookie(userId);
  return tokenData?.idToken || null;
}

// ============================================================================
// Database Hook for Cookie Mode
// ============================================================================

async function saveAccountTokenToCookie(account: Account) {
  if (pool) {
    return;
  }

  if (account.accessToken && account.userId) {
    const accessTokenExpiresAt = account.accessTokenExpiresAt
      ? new Date(account.accessTokenExpiresAt).getTime()
      : Date.now() + TOKEN_ONE_HOUR_MS;

    const refreshTokenExpiresAt = account.refreshTokenExpiresAt
      ? new Date(account.refreshTokenExpiresAt).getTime()
      : undefined;

    const tokenData: OidcTokenData = {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken || undefined,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      userId: account.userId,
      idToken: account.idToken || undefined,
    };

    await saveTokenCookie(tokenData);
    console.log("[Auth] Token saved to cookie (stateless mode)");
  }
}

// ============================================================================
// Better Auth Configuration
// ============================================================================

export const auth: Auth<BetterAuthOptions> = betterAuth({
  debug: !IS_PRODUCTION,
  secret: BETTER_AUTH_SECRET,
  baseURL: BASE_URL,
  ...(pool && { database: pool }),
  account: {
    storeStateStrategy: pool ? "database" : "cookie",
    storeAccountCookie: !pool,
  },
  trustedOrigins: TRUSTED_ORIGINS,
  session: {
    cookieCache: {
      enabled: true,
      strategy: "jwe",
      maxAge: TOKEN_SEVEN_DAYS_SECONDS,
    },
    expiresIn: TOKEN_SEVEN_DAYS_SECONDS,
    updateAge: 60 * 60 * 24,
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
          getUserInfo: (tokens) =>
            getUserInfoFromTokens(tokens, OIDC_DISCOVERY_URL),
        },
      ],
    }),
  ],
  databaseHooks: {
    account: {
      create: {
        after: saveAccountTokenToCookie,
      },
      update: {
        after: saveAccountTokenToCookie,
      },
    },
  },
});
