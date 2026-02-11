import { getRegistries, getServers, getServersByRegistryName } from "./actions";
import { ServersWrapper } from "./components/servers-wrapper";

interface CatalogPageProps {
  searchParams: Promise<{ registryName?: string }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { registryName } = await searchParams;
  const [registries, servers] = await Promise.all([
    getRegistries(),
    registryName ? getServersByRegistryName(registryName) : getServers(),
  ]);

  return <ServersWrapper servers={servers} registries={registries} />;
}
