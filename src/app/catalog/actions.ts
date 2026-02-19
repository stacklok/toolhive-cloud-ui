"use server";

import type {
  GithubComStacklokToolhiveRegistryServerInternalServiceRegistryInfo,
  V0ServerJson,
} from "@/generated/types.gen";
import { getAuthenticatedClient } from "@/lib/api-client";

/** Fetches all available MCP server registries */
export async function getRegistries(): Promise<
  GithubComStacklokToolhiveRegistryServerInternalServiceRegistryInfo[]
> {
  const api = await getAuthenticatedClient();
  const registries = await api.getExtensionV0Registries({
    client: api.client,
  });

  if (registries.error) {
    console.error("[catalog] Failed to fetch registries:", registries.error);
    throw registries.error;
  }

  if (!registries.data) {
    return [];
  }

  return registries.data.registries ?? [];
}

export async function getServers(): Promise<V0ServerJson[]> {
  const api = await getAuthenticatedClient();
  const servers = await api.getRegistryV01Servers({
    client: api.client,
    query: {
      version: "latest",
    },
  });

  if (servers.error) {
    console.error("[catalog] Failed to fetch servers:", servers.error);
    throw servers.error;
  }

  if (!servers.data) {
    return [];
  }

  const data = servers.data;
  const items = Array.isArray(data?.servers) ? data.servers : [];

  // Extract the server objects from the response
  return items
    .map((item) => item?.server)
    .filter((server): server is V0ServerJson => server != null);
}

/**
 * Fetches all MCP servers from a specific registry
 * @param registryName - The unique name of the registry to query
 */
export async function getServersByRegistryName(
  registryName: string,
): Promise<V0ServerJson[]> {
  const api = await getAuthenticatedClient();
  const servers = await api.getRegistryByRegistryNameV01Servers({
    client: api.client,
    path: {
      registryName,
    },
    query: {
      version: "latest",
    },
  });

  if (servers.error) {
    console.error("[catalog] Failed to fetch servers:", servers.error);
    throw servers.error;
  }

  const items = servers.data?.servers ?? [];
  return items
    .map((item) => item?.server)
    .filter((server): server is V0ServerJson => server != null);
}
