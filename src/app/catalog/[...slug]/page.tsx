import { notFound } from "next/navigation";
import { getServerDetails } from "./actions";
import { ServerDetailTitle } from "./components/server-detail-title";
import { ServersDetailTabs } from "./components/servers-detail-tabs";

interface CatalogDetailPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function CatalogDetailPage({
  params,
}: CatalogDetailPageProps) {
  const { slug } = await params;

  // Validate that slug has exactly 3 segments: [repoName, serverName, version]
  if (slug.length !== 3) {
    notFound();
  }

  const [repoName, serverName, version] = slug;

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
    <div className="mx-auto flex flex-col gap-2 pt-5 pb-8 px-8">
      <ServerDetailTitle
        publisher={server.repository?.source}
        serverName={server.name || "Unknown server"}
        version={version}
      />

      <ServersDetailTabs
        description={server.description}
        serverUrl={server.remotes?.[0]?.url}
        repositoryUrl={server.repository?.url}
      />
    </div>
  );
}
