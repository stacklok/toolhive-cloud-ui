"use server";

import { getAuthenticatedClient } from "@/lib/api-client";

export async function getServerDetails(serverName: string, version: string) {
  const api = await getAuthenticatedClient();

  const registriesResult = await api.getV1Registries({ client: api.client });
  const registryName = registriesResult.data?.registries?.[0]?.name;

  if (!registryName) {
    return {
      error: new Error("No registry available"),
      data: null,
      response: null,
    };
  }

  const { error, data, response } =
    await api.getRegistryByRegistryNameV01ServersByServerNameVersionsByVersion({
      path: {
        registryName,
        serverName,
        version,
      },
      client: api.client,
    });

  return { error, data, response };
}
