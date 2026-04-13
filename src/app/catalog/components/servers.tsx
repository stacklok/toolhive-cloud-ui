"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { V0ServerJson } from "@/generated/types.gen";
import { EmptyState } from "./empty-state";
import { ServerCard } from "./server-card";
import { ServersTable } from "./servers-table";

interface ServersProps {
  servers: V0ServerJson[];
  registryName: string;
  viewMode: "grid" | "list";
  searchQuery: string;
  onClearSearch: () => void;
}

/**
 * Client component that displays servers based on view mode.
 * Filtering is done server-side — this component renders whatever servers are passed in.
 */
export function Servers({
  servers,
  registryName,
  viewMode,
  searchQuery,
  onClearSearch,
}: ServersProps) {
  const router = useRouter();

  const handleServerClick = (server: V0ServerJson) => {
    if (!server.name) return;

    const detailUrl = `/catalog/${server.name}/${server.version || "latest"}?registryName=${encodeURIComponent(registryName)}`;
    router.push(detailUrl);
  };

  if (servers.length === 0) {
    if (searchQuery) {
      return (
        <EmptyState
          variant="no-matching-items"
          title="No results found"
          description={`We couldn't find any servers matching "${searchQuery}". Try adjusting your search.`}
          actions={
            <Button variant="outline" onClick={onClearSearch}>
              Clear search
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        variant="no-items"
        title="No servers available"
        description="There are no MCP servers in the catalog yet. Check back later."
      />
    );
  }

  if (viewMode === "list") {
    return (
      <div className="pb-6">
        <ServersTable servers={servers} onServerClick={handleServerClick} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 pb-3 md:grid-cols-2 lg:grid-cols-3">
      {servers.map((server) => (
        <ServerCard
          key={server.name}
          server={server}
          serverUrl={server.remotes?.[0]?.url}
          onClick={() => handleServerClick(server)}
        />
      ))}
    </div>
  );
}
