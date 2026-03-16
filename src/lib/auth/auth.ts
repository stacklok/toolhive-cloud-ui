import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import {
  BASE_URL,
  BETTER_AUTH_RATE_LIMIT,
  BETTER_AUTH_SECRET,
  IS_PRODUCTION,
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
  OIDC_DISCOVERY_URL,
  OIDC_PROVIDER_ID,
  OIDC_SCOPES,
  TOKEN_SEVEN_DAYS_SECONDS,
  TRUSTED_ORIGINS,
} from "./constants";
import { pool } from "./db";
import type { OidcDiscovery, OidcDiscoveryResponse } from "./types";
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
// Better Auth Configuration
// ============================================================================

export const auth = betterAuth({
  debug: !IS_PRODUCTION,
  secret: BETTER_AUTH_SECRET,
  baseURL: BASE_URL,
  ...(pool && { database: pool }),
  // Rate limit override for E2E tests.
  // Better Auth's default rate limit for /sign-in/* is 3 requests per 10 seconds.
  // This is too restrictive for E2E tests where multiple tests authenticate in
  // quick succession. We use customRules because the default special rules for
  // sign-in paths take precedence over the global max setting.
  ...(BETTER_AUTH_RATE_LIMIT && {
    rateLimit: {
      customRules: {
        "/sign-in/*": {
          max: BETTER_AUTH_RATE_LIMIT,
          window: 10,
        },
      },
    },
  }),
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
          getUserInfo: (tokens) => {
            return getUserInfoFromTokens(tokens, OIDC_DISCOVERY_URL);
          },
        },
      ],
    }),
  ],
});
