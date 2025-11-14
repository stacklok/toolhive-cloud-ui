import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";

// Read from environment variables to support any OIDC provider
const OIDC_ISSUER = process.env.OIDC_ISSUER_URL;
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;
const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

// Validate required environment variables
if (!BETTER_AUTH_SECRET) {
  throw new Error(
    "[Better Auth] BETTER_AUTH_SECRET is required. Set it in .env.local to a strong, random value.",
  );
}

if (!OIDC_ISSUER || !OIDC_CLIENT_ID || !OIDC_CLIENT_SECRET) {
  throw new Error(
    "[Better Auth] OIDC configuration is incomplete. Set OIDC_ISSUER_URL, OIDC_CLIENT_ID, and OIDC_CLIENT_SECRET in .env.local",
  );
}

console.log("[Better Auth] OIDC Configuration:", {
  issuer: OIDC_ISSUER,
  clientId: OIDC_CLIENT_ID,
  baseURL: BETTER_AUTH_URL,
  discoveryUrl: `${OIDC_ISSUER}/.well-known/openid-configuration`,
  callbackURL: `${BETTER_AUTH_URL}/api/auth/oauth2/callback/oidc`,
});

// Configure trusted origins - defaults to localhost ports for development
// Set TRUSTED_ORIGINS environment variable for production (comma-separated list)
const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",").map((origin) => origin.trim())
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3003",
    ];

// Always include BETTER_AUTH_URL if not already present
if (BETTER_AUTH_URL && !trustedOrigins.includes(BETTER_AUTH_URL)) {
  trustedOrigins.push(BETTER_AUTH_URL);
}

export const auth = betterAuth({
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  trustedOrigins,
  // No database configuration - running in stateless mode
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: {
      enabled: true,
      maxAge: 30 * 24 * 60 * 60, // 30 days cache duration
      strategy: "jwe", // Use encrypted tokens for better security
      refreshCache: true, // Enable stateless refresh
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "oidc",
          discoveryUrl: `${OIDC_ISSUER}/.well-known/openid-configuration`,
          clientId: OIDC_CLIENT_ID,
          clientSecret: OIDC_CLIENT_SECRET,
          scopes: ["openid", "email", "profile"],
        },
      ],
    }),
  ],
});
