import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Don't specify baseURL - it will use the same origin as the page
  // This avoids CORS issues when Next.js uses a different port
  plugins: [genericOAuthClient()],
});

// You can also export specific methods if you prefer
export const { signIn, signOut, useSession } = authClient;
