import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  // Try to load servers list from the registry API.
  // In dev, this may fail if no backend is running; tests use MSW.
  let serversSummary: { count: number; titles: string[] } | null = null;
  try {
    const res = await fetch("/registry/v0.1/servers");
    if (res.ok) {
      const data = (await res.json()) as any;
      const items = Array.isArray(data?.servers) ? data.servers : [];
      const titles = items
        .map((it: any) => it?.server?.title || it?.server?.name)
        .filter(Boolean)
        .slice(0, 5);
      serversSummary = { count: items.length, titles };
    }
  } catch {
    // ignore; likely no backend in dev
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

          <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            {serversSummary ? (
              <>
                <div>
                  Registry servers available:{" "}
                  <strong>{serversSummary.count}</strong>
                </div>
                {serversSummary.titles.length > 0 && (
                  <div>Sample: {serversSummary.titles.join(", ")}</div>
                )}
              </>
            ) : (
              <div className="italic">
                Registry unavailable in dev (expected)
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
