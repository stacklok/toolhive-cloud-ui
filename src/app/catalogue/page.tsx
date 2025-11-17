"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { signOut, useSession } from "@/lib/auth-client";

export default function CataloguePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setIsSigningOut(false);
      toast.error("Signout failed", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    }
  };

  if (isPending || !session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 rounded-lg bg-white p-12 shadow-lg dark:bg-zinc-900">
        <h1 className="text-3xl font-bold text-black dark:text-white">
          Hello World! 🎉
        </h1>

        <div className="flex flex-col gap-4 text-center">
          <p className="text-zinc-600 dark:text-zinc-400">
            You are successfully authenticated!
          </p>

          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              User Info:
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Email: <strong>{session.user.email || "Not provided"}</strong>
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              User ID: <strong>{session.user.id}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="rounded-full bg-red-600 px-6 py-3 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {isSigningOut ? "Signing Out..." : "Sign Out"}
        </button>
      </main>
    </div>
  );
}
