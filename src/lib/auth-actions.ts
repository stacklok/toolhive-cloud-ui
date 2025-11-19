"use server";

import { clearOidcProviderToken } from "@/lib/auth";

/**
 * Server action to clear OIDC token cookie on sign out.
 * Called by client-side signOut function.
 * Throws an error if it fails.
 */
export async function clearOidcTokenAction(): Promise<void> {
  await clearOidcProviderToken();
}
