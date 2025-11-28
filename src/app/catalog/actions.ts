"use server";

import type { V0ServerJson } from "@/generated/types.gen";
import { getAuthenticatedClient } from "@/lib/api-client";

export async function getServers(): Promise<V0ServerJson[]> {
  const api = await getAuthenticatedClient();
  const resp = await api.getRegistryV01Servers({
    client: api.client,
  });

  if (resp.error) {
    console.error("[catalog] Failed to fetch servers:", resp.error);
    throw new Error("Failed to fetch servers");
  }

  if (!resp.data) {
    return [];
  }

  const data = resp.data;
  const items = Array.isArray(data?.servers) ? data.servers : [];

  // Extract the server objects from the response
  return items
    .map((item) => item?.server)
    .filter((server): server is V0ServerJson => server != null);
}
