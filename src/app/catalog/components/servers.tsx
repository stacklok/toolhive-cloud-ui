"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { V0ServerJson } from "@/generated/types.gen";
import { EmptyState } from "./empty-state";
import { ServerCard } from "./server-card";
import { ServersTable } from "./servers-table";

interface ServersProps {
  servers: V0ServerJson[];
  viewMode: "grid" | "list";
  searchQuery: string;
  onClearSearch: () => void;
}

/**
 * Client component that displays filtered servers based on view mode and search query
 */
export function Servers({
  servers,
  viewMode,
  searchQuery,
  onClearSearch,
}: ServersProps) {
  const router = useRouter();

  const filteredServers = useMemo(() => {
    if (!searchQuery.trim()) {
      return servers;
    }

    const query = searchQuery.toLowerCase();
    return servers.filter(
      (server) =>
        server.name?.toLowerCase().includes(query) ||
        server.title?.toLowerCase().includes(query) ||
        server.description?.toLowerCase().includes(query),
    );
  }, [servers, searchQuery]);

  const handleServerClick = (server: V0ServerJson) => {
    if (!server.name) return;

    const detailUrl = `/catalog/${server.name}/${server.version || "latest"}`;
    router.push(detailUrl);
  };

  if (filteredServers.length === 0) {
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
        <ServersTable
          servers={filteredServers}
          onServerClick={handleServerClick}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 pb-6 md:grid-cols-2 lg:grid-cols-3 px-4">
      {filteredServers.map((server) => (
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
