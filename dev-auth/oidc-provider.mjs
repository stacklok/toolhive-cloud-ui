/**
 * Dev-only OIDC provider for local testing.
 *
 * IMPORTANT: This is NOT for production use. It:
 * - Auto logs-in a test user and auto-consents
 * - Issues refresh tokens unconditionally (issueRefreshToken = true)
 * - Uses very short AccessToken TTL (15s) to exercise refresh flow
 * - Uses in-memory adapter and generated signing keys
 */
import { config } from "dotenv";
import Provider from "oidc-provider";

config();
config({ path: ".env.local" });

const ISSUER = process.env.OIDC_ISSUER_URL || "http://localhost:4000";
const PORT = new URL(ISSUER).port || 4000;
const CLIENT_ID = process.env.OIDC_CLIENT_ID || "better-auth-dev";
const CLIENT_SECRET =
  process.env.OIDC_CLIENT_SECRET || "dev-secret-change-in-production";

// Simple in-memory account storage
const accounts = {
  "test-user": {
    accountId: "test-user",
    email: "test@example.com",
    email_verified: true,
    name: "Test User",
  },
};

// Configuration
const configuration = {
  clients: [
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uris: [
        // Better Auth genericOAuth uses /oauth2/callback/:providerId
        "http://localhost:3000/api/auth/oauth2/callback/oidc",
        "http://localhost:3001/api/auth/oauth2/callback/oidc",
        "http://localhost:3002/api/auth/oauth2/callback/oidc",
        "http://localhost:3003/api/auth/oauth2/callback/oidc",
        "http://localhost:3000/api/auth/oauth2/callback/okta",
      ],
      response_types: ["code"],
      grant_types: ["authorization_code", "refresh_token"],
      token_endpoint_auth_method: "client_secret_post",
    },
  ],
  cookies: {
    keys: ["some-secret-key-for-dev"],
  },
  findAccount: async (_ctx, id) => {
    const account = accounts[id];
    if (!account) return undefined;

    return {
      accountId: id,
      async claims() {
        return {
          sub: id,
          email: account.email,
          email_verified: account.email_verified,
          name: account.name,
        };
      },
    };
  },
  // Simple interaction - auto-login for dev
  interactions: {
    url(_ctx, interaction) {
      return `/interaction/${interaction.uid}`;
    },
  },
  features: {
    // Disable built-in dev interactions in favor of our custom auto-login
    // and auto-consent middleware used for local testing.
    devInteractions: { enabled: false },
  },
  // Explicitly declare supported scopes, including offline_access for refresh tokens
  // Scopes supported by the dev provider (app requests offline_access in dev and prod)
  scopes: ["openid", "email", "profile", "offline_access"],
  claims: {
    email: ["email", "email_verified"],
    profile: ["name"],
  },
  ttl: {
    // Short-lived access tokens to force refresh during dev
    AccessToken: 15, // seconds
    RefreshToken: 86400 * 30, // 30 days
  },
  // Dev-only: always issue refresh tokens to make the flow reliable locally
  issueRefreshToken: async () => true,
};

const oidc = new Provider(ISSUER, configuration);

// Simple interaction endpoint for dev - auto-login as test-user
oidc.use(async (ctx, next) => {
  if (ctx.path.startsWith("/interaction/")) {
    const _uid = ctx.path.split("/")[2];
    const interaction = await oidc.interactionDetails(ctx.req, ctx.res);

    if (interaction.prompt.name === "login") {
      // Auto-login as test-user for dev
      await oidc.interactionFinished(
        ctx.req,
        ctx.res,
        {
          login: {
            accountId: "test-user",
          },
        },
        { mergeWithLastSubmission: false },
      );
      return;
    }

    if (interaction.prompt.name === "consent") {
      // Auto-consent for dev
      const grant = new oidc.Grant({
        accountId: interaction.session.accountId,
        clientId: interaction.params.client_id,
      });

      // Grant requested scopes intersected with allowed ones
      const requestedScopes = interaction.params.scope
        ?.split(" ")
        .filter(Boolean) || ["openid", "email", "profile"];
      const allowedScopes = ["openid", "email", "profile", "offline_access"];
      const grantedScopes = requestedScopes.filter((s) =>
        allowedScopes.includes(s),
      );
      // Dev-only provider already issues refresh tokens unconditionally via
      // `issueRefreshToken`, so we don't need to force-add offline_access here.
      grant.addOIDCScope(grantedScopes.join(" "));

      await grant.save();

      await oidc.interactionFinished(
        ctx.req,
        ctx.res,
        {
          consent: {
            grantId: grant.jti,
          },
        },
        { mergeWithLastSubmission: true },
      );
      return;
    }
  }
  await next();
});

oidc.listen(PORT, () => {
  console.log(`🔐 OIDC Provider running at ${ISSUER}`);
  console.log(`📝 Client ID: ${CLIENT_ID}`);
  console.log(`🔑 Client Secret: ${CLIENT_SECRET}`);
  console.log(`👤 Test user: test@example.com`);
  console.log(
    `\n⚙️  Update your .env.local with:\nOIDC_CLIENT_ID=${CLIENT_ID}\nOIDC_CLIENT_SECRET=${CLIENT_SECRET}\nOIDC_ISSUER_URL=${ISSUER}`,
  );
});
