"use server";

import type { V0ServerResponse } from "@/generated/types.gen";
import { getAuthenticatedClient } from "@/lib/api-client";

export async function getServerDetails(
  serverName: string,
  version: string,
): Promise<V0ServerResponse | null> {
  try {
    const api = await getAuthenticatedClient();

    const response =
      await api.getRegistryV01ServersByServerNameVersionsByVersion({
        path: {
          serverName,
          version,
        },
        client: api.client,
      });

    if (response.error) {
      if (response.response?.status === 404) {
        console.warn("Server not found:", { serverName, version });
        return null;
      }
      console.error("Failed to fetch server details:", {
        serverName,
        version,
        error: response.error,
      });
      return null;
    }

    return response.data ?? null;
  } catch (error) {
    console.error("Failed to fetch server details:", error);
    return null;
  }
}
