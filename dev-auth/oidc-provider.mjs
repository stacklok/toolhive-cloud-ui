import Provider from "oidc-provider";

const ISSUER = "http://localhost:4000";
const PORT = 4000;

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
      client_id: "better-auth-dev",
      client_secret: "dev-secret-change-in-production",
      redirect_uris: [
        // Better Auth genericOAuth uses /oauth2/callback/:providerId
        "http://localhost:3000/api/auth/oauth2/callback/oidc",
        "http://localhost:3001/api/auth/oauth2/callback/oidc",
        "http://localhost:3002/api/auth/oauth2/callback/oidc",
        "http://localhost:3003/api/auth/oauth2/callback/oidc",
      ],
      response_types: ["code"],
      grant_types: ["authorization_code", "refresh_token"],
      token_endpoint_auth_method: "client_secret_post",
    },
  ],
  cookies: {
    keys: ["some-secret-key-for-dev"],
  },
  findAccount: async (ctx, id) => {
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
    url(ctx, interaction) {
      return `/interaction/${interaction.uid}`;
    },
  },
  features: {
    devInteractions: { enabled: true }, // Enable dev interactions for easy testing
  },
  claims: {
    email: ["email", "email_verified"],
    profile: ["name"],
  },
  ttl: {
    AccessToken: 3600, // 1 hour
    RefreshToken: 86400 * 30, // 30 days
  },
};

const oidc = new Provider(ISSUER, configuration);

// Simple interaction endpoint for dev - auto-login as test-user
oidc.use(async (ctx, next) => {
  if (ctx.path.startsWith("/interaction/")) {
    const uid = ctx.path.split("/")[2];
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

      grant.addOIDCScope(
        interaction.params.scope
          ?.split(" ")
          .filter((scope) => ["openid", "email", "profile"].includes(scope))
          .join(" ") || "openid email profile",
      );

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
  console.log(`📝 Client ID: better-auth-dev`);
  console.log(`🔑 Client Secret: dev-secret-change-in-production`);
  console.log(`👤 Test user: test@example.com`);
  console.log(
    `\n⚙️  Update your .env.local with:\nOIDC_CLIENT_ID=better-auth-dev\nOIDC_CLIENT_SECRET=dev-secret-change-in-production\nOIDC_ISSUER_URL=${ISSUER}`,
  );
});
