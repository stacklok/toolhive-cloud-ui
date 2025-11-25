"use server";

import { getAuthenticatedClient } from "@/lib/api-client";

export async function getServerDetails(serverName: string, version: string) {
  const api = await getAuthenticatedClient();

  const { error, data, response } =
    await api.getRegistryV01ServersByServerNameVersionsByVersion({
      path: {
        serverName,
        version,
      },
      client: api.client,
    });

  return { error, data, response };
}
