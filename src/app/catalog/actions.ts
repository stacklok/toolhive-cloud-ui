"use server";

import type {
  GithubComStacklokToolhiveRegistryServerInternalServiceRegistryInfo,
  V0ServerJson,
  V0ServerResponse,
} from "@/generated/types.gen";
import { getAuthenticatedClient } from "@/lib/api-client";

// TODO: remove once UI pagination is implemented
const SERVER_PAGE_LIMIT = 200;

function extractServers(items: V0ServerResponse[]): V0ServerJson[] {
  return items
    .map((item) => item?.server)
    .filter((server): server is V0ServerJson => server != null);
}

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

/** Fetches MCP servers across all registries */
export async function getServers(): Promise<V0ServerJson[]> {
  const api = await getAuthenticatedClient();

  const response = await api.getRegistryV01Servers({
    client: api.client,
    query: { version: "latest", limit: SERVER_PAGE_LIMIT },
  });

  if (response.error) {
    console.error("[catalog] Failed to fetch servers:", response.error);
    throw response.error;
  }

  return extractServers(response.data?.servers ?? []);
}

/**
 * Fetches MCP servers from a specific registry
 * @param registryName - The unique name of the registry to query
 */
export async function getServersByRegistryName(
  registryName: string,
): Promise<V0ServerJson[]> {
  const api = await getAuthenticatedClient();

  const response = await api.getRegistryByRegistryNameV01Servers({
    client: api.client,
    path: { registryName },
    query: { version: "latest", limit: SERVER_PAGE_LIMIT },
  });

  if (response.error) {
    console.error("[catalog] Failed to fetch servers:", response.error);
    throw response.error;
  }

  return extractServers(response.data?.servers ?? []);
}
