import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Don't specify baseURL - it will use the same origin as the page
  // This avoids CORS issues when Next.js uses a different port
  plugins: [genericOAuthClient()],
});

export const { signIn, useSession } = authClient;

export const signOut = async (options?: { redirectTo?: string }) => {
  const redirectUri = options?.redirectTo || "/sign-in";

  // Note: This does NOT logout from Okta SSO session
  // User will be automatically re-authenticated on next sign-in (SSO behavior)
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        window.location.href = redirectUri;
      },
    },
  });
};
