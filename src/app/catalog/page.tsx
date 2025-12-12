import { getServers } from "./actions";
import { ServersWrapper } from "./components/servers-wrapper";

export default async function CatalogPage() {
  const servers = await getServers();

  return <ServersWrapper servers={servers} />;
}
