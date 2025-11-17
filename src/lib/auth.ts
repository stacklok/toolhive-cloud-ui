import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

const OIDC_PROVIDER_ID = process.env.OIDC_PROVIDER_ID || "oidc";
const OIDC_ISSUER = process.env.OIDC_ISSUER || "";
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
    expiresIn: 60 * 60 * 24 * 7,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: OIDC_PROVIDER_ID,
          discoveryUrl: `${OIDC_ISSUER}/.well-known/openid-configuration`,
          authorizationUrl: `${OIDC_ISSUER}/v1/authorize`,
          tokenUrl: `${OIDC_ISSUER}/v1/token`,
          userInfoUrl: `${OIDC_ISSUER}/v1/userinfo`,
          redirectURI: `${BASE_URL}/api/auth/oauth2/callback/${OIDC_PROVIDER_ID}`,
          clientId: process.env.OIDC_CLIENT_ID || "",
          clientSecret: process.env.OIDC_CLIENT_SECRET || "",
          scopes: ["openid", "email", "profile"],
          pkce: false,
        },
      ],
    }),
  ],
});
