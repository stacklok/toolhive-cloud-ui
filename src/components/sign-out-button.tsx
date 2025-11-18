"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function SignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      toast.error("Signout failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
      setIsSigningOut(false);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={isSigningOut}
      variant="destructive"
      size="lg"
      className="rounded-full"
    >
      {isSigningOut ? "Signing Out..." : "Sign Out"}
    </Button>
  );
}
