"use server";

import { getRegistryV01Servers } from "@/generated/sdk.gen";

export async function getServersSummary() {
  try {
    const resp = await getRegistryV01Servers();
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
