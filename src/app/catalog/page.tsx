import { getRegistries, getServers, getServersByRegistryName } from "./actions";
import { ServersWrapper } from "./components/servers-wrapper";
import { CATALOG_PAGE_SIZE } from "./constants";

interface CatalogPageProps {
  searchParams: Promise<{
    registryName?: string;
    cursor?: string;
    limit?: string;
    search?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { registryName, cursor, limit, search } = await searchParams;

  const paginationParams = {
    cursor: cursor || undefined,
    limit: limit ? Number(limit) : CATALOG_PAGE_SIZE,
    search: search || undefined,
  };

  const [registries, { servers, nextCursor }] = await Promise.all([
    getRegistries(),
    registryName
      ? getServersByRegistryName(registryName, paginationParams)
      : getServers(paginationParams),
  ]);

  return (
    <ServersWrapper
      servers={servers}
      registries={registries}
      nextCursor={nextCursor}
    />
  );
}
