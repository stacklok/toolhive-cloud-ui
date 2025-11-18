import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

const OIDC_PROVIDER_ID = process.env.OIDC_PROVIDER_ID || "oidc";
// Support both OIDC_ISSUER and OIDC_ISSUER_URL env var names
const OIDC_ISSUER =
  process.env.OIDC_ISSUER || process.env.OIDC_ISSUER_URL || "";
const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",").map((s) => s.trim())
  : [BASE_URL, "http://localhost:3002", "http://localhost:3003"];

if (!trustedOrigins.includes(BASE_URL)) {
  trustedOrigins.push(BASE_URL);
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "build-time-placeholder",
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
          discoveryUrl: `${OIDC_ISSUER}/.well-known/openid-configuration`,
          redirectURI: `${BASE_URL}/api/auth/oauth2/callback/${OIDC_PROVIDER_ID}`,
          clientId: process.env.OIDC_CLIENT_ID || "",
          clientSecret: process.env.OIDC_CLIENT_SECRET || "",
          scopes: ["openid", "email", "profile"],
          pkce: true,
        },
      ],
    }),
  ],
} as BetterAuthOptions);
