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
    return [];
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

export async function getServersSummary() {
  const api = await getAuthenticatedClient();
  const resp = await api.getRegistryV01Servers({ client: api.client });

  if (resp.error) {
    console.error("[catalog] Failed to fetch servers:", resp.error);
    return { count: 0, titles: [], sample: [] };
  }

  if (!resp.data) {
    return { count: 0, titles: [], sample: [] };
  }

  const items = Array.isArray(resp.data?.servers) ? resp.data.servers : [];

  const sample = items.slice(0, 5).map((it) => ({
    title: it?.server?.title ?? it?.server?.name ?? "Unknown",
    name: it?.server?.name ?? "unknown",
    version: it?.server?.version,
  }));

  const titles = sample.map((s) => s.title);

  return { count: items.length, titles, sample };
}
