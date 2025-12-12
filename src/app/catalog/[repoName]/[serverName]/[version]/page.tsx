import { notFound } from "next/navigation";
import { getServerDetails } from "./actions";
import { ServerDetail } from "./components/server-detail";
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

  return (
    <div className="flex flex-col gap-2 pb-8 px-4">
      <ServerDetailTitle
        publisher={server.repository?.source}
        serverName={server.name || "Unknown server"}
        version={version}
      />

      <ServerDetail
        description={server.description}
        serverUrl={server.remotes?.[0]?.url}
        repositoryUrl={server.repository?.url}
      />
    </div>
  );
}
