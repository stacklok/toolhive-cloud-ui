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

        <SignOut />
      </main>
    </div>
  );
}
