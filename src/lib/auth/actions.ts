"use server";

import { headers } from "next/headers";
import { auth, getOidcDiscovery } from "@/lib/auth/auth";
import { BASE_URL, OIDC_PROVIDER_ID } from "@/lib/auth/constants";

/**
 * Server action to build the OIDC logout URL for RP-Initiated Logout.
 * Returns the OIDC provider's logout URL, or "/signin" as fallback.
 */
export async function getOidcSignOutUrl(): Promise<string> {
  try {
    const requestHeaders = await headers();

    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session?.user?.id) {
      console.warn("[Auth] No active session for logout");
      return "/signin";
    }

    const discovery = await getOidcDiscovery();

    if (!discovery?.endSessionEndpoint) {
      console.error("[Auth] OIDC end_session_endpoint not available");
      return "/signin";
    }

    const tokenData = await auth.api.getAccessToken({
      headers: requestHeaders,
      body: { providerId: OIDC_PROVIDER_ID },
    });
    const idToken = tokenData?.idToken ?? null;

    if (!idToken) {
      console.warn("[Auth] No idToken found for OIDC logout");
      return "/signin";
    }

    const url = new URL(discovery.endSessionEndpoint);
    url.searchParams.set("id_token_hint", idToken);
    url.searchParams.set("post_logout_redirect_uri", `${BASE_URL}/signin`);

    return url.toString();
  } catch (error) {
    console.error("[Auth] Error building OIDC logout URL:", error);
    return "/signin";
  }
}
