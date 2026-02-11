import { notFound } from "next/navigation";
import { getTools } from "@/lib/utils";
import { getServerDetails } from "./actions";
import { ServerDetail } from "./components/server-detail";
import { ServerDetailTabs } from "./components/server-detail-tabs";
import { ServerDetailTitle } from "./components/server-detail-title";

interface CatalogDetailPageProps {
  params: Promise<{
    repoName: string;
    serverName: string;
    version: string;
  }>;
}

export default async function CatalogDetailPage({
  params,
}: CatalogDetailPageProps) {
  const { repoName, serverName, version } = await params;
  const { data: serverResponse, response } = await getServerDetails(
    `${repoName}/${serverName}`,
    version,
  );

  // error should be handled in a special error.tsx component https://github.com/stacklok/toolhive-cloud-ui/issues/94

  if (response?.status === 404) {
    notFound();
  }

  const server = serverResponse?.server ?? {};
  const remote = server.remotes?.[0];
  const tools = getTools(server);

  return (
    <div className="flex flex-col gap-5 px-4">
      <ServerDetailTitle server={server} version={version} />

      <ServerDetailTabs tools={tools}>
        <ServerDetail
          description={server.description}
          serverUrl={remote?.url}
          repositoryUrl={server.repository?.url}
        />
      </ServerDetailTabs>
    </div>
  );
}
