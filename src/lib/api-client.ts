/**
 * API Client Configuration
 *
 * Provides authenticated API client for server-side operations.
 *
 * IMPORTANT: This file is SERVER-ONLY and uses Next.js server APIs.
 * - Use in server actions (with "use server")
 * - Use in server components (async functions)
 * - DO NOT import or use in client components
 *
 * Client components should call server actions that use this client.
 */

"use server";

import { cookies, headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createConfig } from "@/generated/client";
import * as apiServices from "@/generated/sdk.gen";
import { auth } from "./auth/auth";
import { OIDC_PROVIDER_ID } from "./auth/constants";
import { isTokenNearExpiry } from "./auth/utils";

const MOCK_SCENARIO_COOKIE = "mock-scenario";
const MOCK_SCENARIO_HEADER = "X-Mock-Scenario";

// Validate required environment variables at module load time (fail-fast)
const API_BASE_URL = process.env.API_BASE_URL;

/**
 * Gets an authenticated API client with OIDC access token.
 * Automatically refreshes the token if expired.
 *
 * Creates a new client instance per request to avoid race conditions
 * when handling multiple concurrent requests with different tokens.
 *
 * Use this in server actions and server components to make authenticated API calls.
 *
 * @param accessToken - Optional access token to use instead of fetching from session
 * @returns API services configured with authentication
 *
 * @example
 * ```typescript
 * export async function getServers() {
 *   const api = await getAuthenticatedClient();
 *   const resp = await api.getRegistryV01Servers();
 *   return resp.data;
 * }
 * ```
 */
export async function getAuthenticatedClient(accessToken?: string) {
  // If no token provided, get it from the session
  if (accessToken === undefined) {
    const requestHeaders = await nextHeaders();

    const session = await auth.api.getSession({
      headers: requestHeaders,
    });

    if (!session?.user?.id) {
      console.log("[API Client] user not found, redirecting to signin");
      redirect("/signin");
    }

    // cookies().set() is NOT allowed from getAuthenticatedClient() — this
    // function is always called from within a Server Component render, even
    // when that render happens as part of a Server Action POST response.
    // Next.js only permits cookies().set() in the *direct* handler of a
    // Server Action (i.e. the "use server" function invoked by the Client
    // Component), not in Server Components rendered as part of the response.
    //
    // Strategy: if the token is near expiry, redirect to the token-refresh
    // Route Handler which CAN write cookies via the HTTP response (it performs
    // the OIDC refresh and saves the rotated refresh token R2), then redirects
    // back. If the token is fresh, call getAccessToken() directly — Better Auth
    // won't refresh (its threshold is 5s), so no Set-Cookie is produced.
    const nearExpiry = await isTokenNearExpiry();

    if (nearExpiry) {
      const currentPath = requestHeaders.get("x-url") || "/catalog";
      console.log(
        `[API Client] token near expiry, redirecting to token-refresh | path=${currentPath}`,
      );
      redirect(
        `/api/auth/token-refresh?redirect=${encodeURIComponent(currentPath)}`,
      );
    }

    let tokenData: {
      accessToken?: string;
      accessTokenExpiresAt?: string;
    } | null = null;
    try {
      tokenData = (await auth.api.getAccessToken({
        headers: requestHeaders,
        body: { providerId: OIDC_PROVIDER_ID },
      })) as { accessToken?: string; accessTokenExpiresAt?: string };
    } catch (err) {
      console.error("[API Client] getAccessToken threw:", err);
      redirect("/signin");
    }

    if (!tokenData?.accessToken) {
      console.log("[API Client] token not found, redirecting to signin");
      redirect("/signin");
    }

    accessToken = tokenData.accessToken;
  }

  const requestHeaders: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  // Mock scenario header is only used in development for testing different backend states
  if (process.env.NODE_ENV === "development") {
    const cookieStore = await cookies();
    const mockScenario = cookieStore.get(MOCK_SCENARIO_COOKIE)?.value;
    if (mockScenario) {
      requestHeaders[MOCK_SCENARIO_HEADER] = mockScenario;
    }
  }

  // Create a new client instance per request to avoid race conditions
  const authenticatedClient = createClient(
    createConfig({
      baseUrl: API_BASE_URL,
      headers: requestHeaders,
    }),
  );

  return { ...apiServices, client: authenticatedClient };
}
