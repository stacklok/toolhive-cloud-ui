"use client";

import { authClient } from "@/lib/auth-client";

const OIDC_PROVIDER_ID = process.env.NEXT_PUBLIC_OIDC_PROVIDER_ID || "oidc";
const OIDC_PROVIDER_NAME =
  process.env.NEXT_PUBLIC_OIDC_PROVIDER_NAME || "OIDC Provider";

export default function LoginPage() {
  const handleOIDCLogin = async () => {
    try {
      console.log("Initiating OIDC sign-in...");
      const { data, error } = await authClient.signIn.oauth2({
        providerId: OIDC_PROVIDER_ID,
        callbackURL: "/dashboard",
      });

      if (error) {
        console.error("Sign-in error from Better Auth:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return;
      }

      console.log("Sign-in successful:", data);
    } catch (error) {
      console.error("Unexpected error during sign-in:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 rounded-lg bg-white p-12 shadow-lg dark:bg-zinc-900">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Log In
        </h1>

        <p className="text-center text-zinc-600 dark:text-zinc-400">
          Sign in with your OIDC provider to continue
        </p>

        <button
          type="button"
          onClick={handleOIDCLogin}
          className="rounded-full bg-black px-8 py-3 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Sign In with {OIDC_PROVIDER_NAME}
        </button>
      </main>
    </div>
  );
}
