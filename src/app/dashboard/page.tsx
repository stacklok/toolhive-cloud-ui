import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
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
              Email: <strong>{session.user.email}</strong>
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              User ID: <strong>{session.user.id}</strong>
            </p>
          </div>
        </div>

        <form action="/api/auth/sign-out" method="POST">
          <button
            type="submit"
            className="rounded-full bg-red-600 px-6 py-3 text-white transition-colors hover:bg-red-700"
          >
            Sign Out
          </button>
        </form>
      </main>
    </div>
  );
}
