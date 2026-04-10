import { getRegistries, getServersByRegistryName } from "./actions";
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
    limit: Number.isFinite(Number(limit)) ? Number(limit) : CATALOG_PAGE_SIZE,
    search: search || undefined,
  };

  const registries = await getRegistries();
  const selectedRegistry = registryName ?? registries[0]?.name;

  const { servers, nextCursor } = selectedRegistry
    ? await getServersByRegistryName(selectedRegistry, paginationParams)
    : { servers: [], nextCursor: undefined };

  return (
    <ServersWrapper
      servers={servers}
      registries={registries}
      nextCursor={nextCursor}
    />
  );
}
