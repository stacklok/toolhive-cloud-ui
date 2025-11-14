"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = useSession();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-4xl font-bold text-black dark:text-white">
          Welcome to ToolHive Cloud UI
        </h1>

        {isPending ? (
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        ) : session?.user ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-zinc-600 dark:text-zinc-400">
              You are logged in as{" "}
              <strong>
                {session.user.email || session.user.name || "User"}
              </strong>
            </p>
            <Link
              href="/dashboard"
              className="rounded-full bg-black px-6 py-3 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-zinc-600 dark:text-zinc-400">
              Please log in to access the application
            </p>
            <Link
              href="/login"
              className="rounded-full bg-black px-6 py-3 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Log In
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
