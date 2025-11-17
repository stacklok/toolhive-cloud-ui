"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function SignOut() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign-out error:", error);
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
