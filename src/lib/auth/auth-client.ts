import { genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { toast } from "sonner";
import { clearOidcTokenAction } from "./auth-actions";

export const authClient = createAuthClient({
  // Don't specify baseURL - it will use the same origin as the page
  // This avoids CORS issues when Next.js uses a different port
  plugins: [genericOAuthClient()],
});

export const { signIn, useSession } = authClient;

export const signOut = async (options?: { redirectTo?: string }) => {
  const redirectUri = options?.redirectTo || "/signin";

  try {
    // Note: This does NOT logout from Okta SSO session
    // User will be automatically re-authenticated on next signin (SSO behavior)
    await authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          // Clear OIDC token cookie after successful sign out
          try {
            await clearOidcTokenAction();
          } catch (error) {
            console.warn("[Auth] Failed to clear OIDC token:", error);
            // Continue with redirect even if cookie cleanup fails
          }
          window.location.href = redirectUri;
        },
        onError: (ctx) => {
          console.error("[Auth] Better Auth sign out error:", ctx.error);
          toast.error("Sign out failed", {
            description:
              ctx.error.message || "An error occurred during sign out",
          });
          // Still redirect even if there's an error
          window.location.href = redirectUri;
        },
      },
    });
  } catch (error) {
    console.error("[Auth] Sign out error:", error);
    toast.error("Sign out failed", {
      description:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
    // Still redirect even if there's an error
    window.location.href = redirectUri;
  }
};
