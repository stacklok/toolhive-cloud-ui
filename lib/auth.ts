import { betterAuth } from "better-auth";

export const auth = betterAuth({
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
  socialProviders: {
    // Configure your OIDC provider here
    // Replace the env vars in .env.local with your actual OIDC provider details
    oidc: {
      clientId: process.env.OIDC_CLIENT_ID || "",
      clientSecret: process.env.OIDC_CLIENT_SECRET || "",
      issuer: process.env.OIDC_ISSUER_URL || "", // Your OIDC provider's issuer URL
    },
  },
});
