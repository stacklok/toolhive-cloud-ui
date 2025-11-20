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
import { client } from "@/generated/client.gen";
import * as apiServices from "@/generated/sdk.gen";
import { auth } from "./auth/auth";
import { getValidOidcToken } from "./auth/token";

/**
 * Gets an authenticated API client with OIDC access token.
 * Automatically refreshes the token if expired.
 *
 * Use this in server actions and server components to make authenticated API calls.
 *
 * @param accessToken - Optional access token to use instead of fetching from session
 * @returns API services configured with authentication
 *
 * @example
 * ```typescript
 * export async function getServersSummary() {
 *   const api = await getAuthenticatedClient();
 *   const resp = await api.getRegistryV01Servers();
 *   return resp.data;
 * }
 * ```
 */
export async function getAuthenticatedClient(accessToken?: string) {
  // If no token provided, get it from the session
  if (accessToken === undefined) {
    try {
      const session = await auth.api.getSession({
        headers: await nextHeaders(),
      });

      if (!session?.user?.id) {
        redirect("/signin");
      }

      const token = await getValidOidcToken(session.user.id);

      if (!token) {
        redirect("/signin");
      }

      accessToken = token;
    } catch (error) {
      console.error("[API Client] Error getting access token:", error);
      redirect("/signin");
    }
  }

  // Configure client with authentication
  client.setConfig({
    baseUrl: process.env.API_BASE_URL || "",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return { ...apiServices, client };
}
