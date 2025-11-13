"use client";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
	const handleOIDCLogin = async () => {
		await authClient.signIn.social({
			provider: "oidc",
			callbackURL: "/dashboard",
		});
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
			<main className="flex flex-col items-center gap-8 rounded-lg bg-white p-12 shadow-lg dark:bg-zinc-900">
				<h1 className="text-3xl font-bold text-black dark:text-white">
					Log In
				</h1>

				<p className="text-center text-zinc-600 dark:text-zinc-400">
					Sign in with your OIDC provider to continue
				</p>

				<button
					type="button"
					onClick={handleOIDCLogin}
					className="rounded-full bg-black px-8 py-3 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
				>
					Sign In with OIDC
				</button>
			</main>
		</div>
	);
}
