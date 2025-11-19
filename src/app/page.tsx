import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-4xl font-bold text-black dark:text-white">
          Welcome to ToolHive Cloud UI
        </h1>

        <div className="flex flex-col items-center gap-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            You are logged in as{" "}
            <strong>{session.user.email || session.user.name || "User"}</strong>
          </p>
          <Link
            href="/catalog"
            className="rounded-full bg-black px-6 py-3 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Go to Catalog
          </Link>
        </div>
      </main>
    </div>
  );
}
