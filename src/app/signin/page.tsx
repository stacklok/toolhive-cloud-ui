"use client";

import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";

const OIDC_PROVIDER_ID = "oidc";

export default function SignInPage() {
  const handleOIDCSignIn = async () => {
    try {
      const { error } = await authClient.signIn.oauth2({
        providerId: OIDC_PROVIDER_ID,
        callbackURL: "/catalog",
      });

      if (error) {
        toast.error("Signin failed", {
          description:
            error.message ||
            "An error occurred during signin. Please try again.",
        });
        return;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      toast.error("Signin error", {
        description: errorMessage,
      });
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Side - Logo Section */}
      <div className="hidden md:flex w-1/2 bg-muted/80 border-r border-border items-start p-10">
        <div className="flex items-center gap-4">
          <Image
            src="/toolhive-icon.svg"
            alt="Toolhive Icon"
            width={24}
            height={24}
            className="shrink-0"
          />
          <h1 className="text-4xl font-bold tracking-tight">Toolhive</h1>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex w-full md:w-1/2 items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-6 w-full max-w-[350px]">
          {/* Header */}
          <div className="flex flex-col items-center space-y-2 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Sign in using your company credentials
            </p>
          </div>

          {/* Sign In Button */}
          <Button
            onClick={handleOIDCSignIn}
            className="w-full h-9 gap-2"
            size="default"
          >
            <Image
              src="/okta-icon.svg"
              alt="Okta"
              width={16}
              height={16}
              className="shrink-0"
            />
            <span>Okta</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
