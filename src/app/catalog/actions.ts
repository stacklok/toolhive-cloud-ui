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

export interface ServerListResult {
  servers: V0ServerJson[];
  nextCursor?: string;
}

interface ServerListParams {
  cursor?: string;
  limit?: number;
  search?: string;
}

export async function getServers(
  params?: ServerListParams,
): Promise<ServerListResult> {
  const api = await getAuthenticatedClient();
  const servers = await api.getRegistryV01Servers({
    client: api.client,
    query: {
      version: "latest",
      cursor: params?.cursor || undefined,
      limit: params?.limit,
      search: params?.search || undefined,
    },
  });

  if (servers.error) {
    console.error("[catalog] Failed to fetch servers:", servers.error);
    throw servers.error;
  }

  if (!servers.data) {
    return { servers: [] };
  }

  const data = servers.data;
  const items = Array.isArray(data?.servers) ? data.servers : [];

  return {
    servers: items
      .map((item) => item?.server)
      .filter((server): server is V0ServerJson => server != null),
    nextCursor: data.metadata?.nextCursor,
  };
}

/**
 * Fetches MCP servers from a specific registry with optional pagination
 * @param registryName - The unique name of the registry to query
 * @param params - Optional pagination and search parameters
 */
export async function getServersByRegistryName(
  registryName: string,
  params?: ServerListParams,
): Promise<ServerListResult> {
  const api = await getAuthenticatedClient();
  const servers = await api.getRegistryByRegistryNameV01Servers({
    client: api.client,
    path: {
      registryName,
    },
    query: {
      version: "latest",
      cursor: params?.cursor || undefined,
      limit: params?.limit,
      search: params?.search || undefined,
    },
  });

  if (servers.error) {
    console.error("[catalog] Failed to fetch servers:", servers.error);
    throw servers.error;
  }

  const items = servers.data?.servers ?? [];
  return {
    servers: items
      .map((item) => item?.server)
      .filter((server): server is V0ServerJson => server != null),
    nextCursor: servers.data?.metadata?.nextCursor,
  };
}
