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

import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, createConfig } from "@/generated/client";
import * as apiServices from "@/generated/sdk.gen";
import { auth } from "./auth/auth";
import { getValidOidcToken } from "./auth/token";

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
    const session = await auth.api.getSession({
      headers: await nextHeaders(),
    });

    if (!session?.user?.id) {
      console.log("[API Client] user not found, redirecting to signin");
      redirect("/signin");
    }

    const token = await getValidOidcToken(session.user.id);
    if (!token) {
      console.log("[API Client] token not found, redirecting to signin");
      redirect("/signin");
    }

    accessToken = token;
  }

  // Create a new client instance per request to avoid race conditions
  const authenticatedClient = createClient(
    createConfig({
      baseUrl: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  );

  return { ...apiServices, client: authenticatedClient };
}
