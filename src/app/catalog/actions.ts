"use server";

import type { V0ServerJson } from "@/generated/types.gen";
import { getAuthenticatedClient } from "@/lib/api-client";

export async function getServers(): Promise<V0ServerJson[]> {
  try {
    const api = await getAuthenticatedClient();
    const resp = await api.getRegistryV01Servers({
      client: api.client,
    });
    const data = resp.data;
    const items = Array.isArray(data?.servers) ? data.servers : [];

    // Extract the server objects from the response
    return items
      .map((item) => item?.server)
      .filter((server): server is V0ServerJson => server != null);
  } catch (error) {
    console.error("[catalog] Failed to fetch servers:", error);
    return [];
  }
}

export async function getServersSummary() {
  try {
    const api = await getAuthenticatedClient();
    const resp = await api.getRegistryV01Servers({
      client: api.client,
    });
    const data = resp.data;
    const items = Array.isArray(data?.servers) ? data.servers : [];

    const titles = items
      .map((it) => it?.server?.title ?? it?.server?.name)
      .filter((t): t is string => typeof t === "string")
      .slice(0, 5);

    const sample = items.slice(0, 5).map((it) => ({
      title: it?.server?.title ?? it?.server?.name ?? "Unknown",
      name: it?.server?.name ?? "unknown",
      version: it?.server?.version,
    }));

    return { count: items.length, titles, sample };
  } catch (error) {
    // Log the error for debugging
    console.error("[catalog] Failed to fetch servers:", error);
    return { count: 0, titles: [], sample: [] };
  }
}
