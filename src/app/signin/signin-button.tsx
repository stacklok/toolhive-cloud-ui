"use client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { OktaIcon } from "@/components/brand-icons";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";

export function SignInButton({ providerId }: { providerId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const isOktaProvider = providerId === "okta" || providerId === "oidc";
  const providerName = providerId.charAt(0).toUpperCase() + providerId.slice(1);

  const handleOIDCSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.oauth2({
        providerId,
        callbackURL: "/catalog",
      });

      if (error) {
        setIsLoading(false);
        toast.error("Signin failed", {
          description:
            error.message ||
            "An error occurred during signin. Please try again.",
        });
        return;
      }
    } catch (error) {
      setIsLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      toast.error("Signin error", {
        description: errorMessage,
      });
    }
  };

  return (
    <Button
      onClick={handleOIDCSignIn}
      className="w-full h-9 gap-2"
      size="default"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
      ) : (
        <>
          {isOktaProvider && <OktaIcon className="size-4 shrink-0" />}
          <span>{providerName}</span>
        </>
      )}
    </Button>
  );
}
