"use client";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";

export function SignInButton({ providerId }: { providerId: string }) {
  const providerName = providerId.charAt(0).toUpperCase() + providerId.slice(1);

  const handleOIDCSignIn = async () => {
    try {
      const { error } = await authClient.signIn.oauth2({
        providerId,
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
    <Button
      onClick={handleOIDCSignIn}
      className="w-full h-9 gap-2"
      size="default"
    >
      <Image
        src="/okta-icon.svg"
        alt={providerName}
        width={16}
        height={16}
        className="shrink-0"
      />
      <span>{providerName}</span>
    </Button>
  );
}
