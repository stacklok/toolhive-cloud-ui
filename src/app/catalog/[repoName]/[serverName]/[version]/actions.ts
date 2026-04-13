"use server";

import { getRegistries } from "@/app/catalog/actions";
import { getAuthenticatedClient } from "@/lib/api-client";

export async function getServerDetails(
  registryName: string | undefined,
  serverName: string,
  version: string,
) {
  const api = await getAuthenticatedClient();

  const resolvedRegistry = registryName || (await getRegistries()).at(0)?.name;

  if (!resolvedRegistry) {
    return {
      error: new Error("No registry available"),
      data: null,
      response: null,
    };
  }

  return api.getRegistryByRegistryNameV01ServersByServerNameVersionsByVersion({
    path: { registryName: resolvedRegistry, serverName, version },
    client: api.client,
  });
}
