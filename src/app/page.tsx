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

  // Try to load servers list from the registry API (SSR).
  // In dev, prefer the standalone mock server to validate server-side fetches.
  let serversSummary: { count: number; titles: string[] } = {
    count: 0,
    titles: [],
  };
  try {
    const base =
      process.env.MOCK_SERVER_ORIGIN ||
      (process.env.NODE_ENV !== "production" ? "http://localhost:9090" : "");
    const url = base
      ? `${base}/registry/v0.1/servers`
      : "/registry/v0.1/servers";
    const res = await fetch(url);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[home] SSR fetch ${url} -> ${res.status}`);
    }
    if (res.ok) {
      type ServersPayload = {
        servers?: Array<{ server?: { title?: string; name?: string } }>;
      };
      const data: ServersPayload = await res.json();
      const items = Array.isArray(data?.servers) ? data.servers : [];
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log(`[home] servers=${items.length}`);
      }
      const titles = items
        .map((it) => it?.server?.title ?? it?.server?.name)
        .filter((t): t is string => typeof t === "string")
        .slice(0, 5);
      serversSummary = { count: items.length, titles };
    }
  } catch {
    // Leave serversSummary at its default { count: 0, titles: [] }
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
            <div>
              Registry servers available:{" "}
              <strong>{serversSummary.count}</strong>
            </div>
            {serversSummary.titles.length > 0 && (
              <div>Sample: {serversSummary.titles.join(", ")}</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
