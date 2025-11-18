import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignOut } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";

export default async function CatalogPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  // Load server registry summary (SSR). In dev, target the mock server.
  let serversSummary: {
    count: number;
    titles: string[];
    sample: Array<{ title: string; name: string; version?: string }>;
  } | null = null;
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
      console.log(`[catalog] SSR fetch ${url} -> ${res.status}`);
    }
    if (res.ok) {
      type ServersPayload = {
        servers?: Array<{
          server?: { title?: string; name?: string; version?: string };
        }>;
      };
      const data: ServersPayload = await res.json();
      const items = Array.isArray(data?.servers) ? data.servers : [];
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log(`[catalog] servers=${items.length}`);
      }
      const titles = items
        .map((it) => it?.server?.title || it?.server?.name)
        .filter(Boolean)
        .slice(0, 5);
      const sample = items.slice(0, 5).map((it) => ({
        title: it?.server?.title ?? it?.server?.name ?? "Unknown",
        name: it?.server?.name ?? "unknown",
        version: it?.server?.version ?? undefined,
      }));
      serversSummary = { count: items.length, titles, sample };
    }
  } catch {
    // ignore in dev if backend is not available
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

        <div className="w-full max-w-xl rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-800">
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">
            Registry
          </p>
          {serversSummary ? (
            <>
              <div className="text-zinc-700 dark:text-zinc-300">
                Servers available: <strong>{serversSummary.count}</strong>
              </div>
              {serversSummary.sample.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-zinc-700 dark:text-zinc-300">
                  {serversSummary.sample.map((s) => (
                    <li key={`${s.name}-${s.title}`}>
                      <strong>{s.title}</strong>
                      <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                        ({s.name}
                        {s.version ? ` @ ${s.version}` : ""})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="italic text-zinc-500 dark:text-zinc-400">
              Registry unavailable in dev (expected)
            </div>
          )}
        </div>

        <SignOut />
      </main>
    </div>
  );
}
