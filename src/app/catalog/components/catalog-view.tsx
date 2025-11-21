"use client";

import { useMemo } from "react";
import type { V0ServerJson } from "@/generated/types.gen";
import { ServerCard } from "./server-card";
import { ServerTable } from "./server-table";

interface CatalogViewProps {
  servers: V0ServerJson[];
  viewMode: "grid" | "list";
  searchQuery: string;
}

/**
 * Client component that displays filtered servers based on view mode and search query
 */
export function CatalogView({
  servers,
  viewMode,
  searchQuery,
}: CatalogViewProps) {
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

  if (filteredServers.length === 0) {
    return (
      <div className="p-12 text-center">
        {searchQuery
          ? `No servers found matching "${searchQuery}"`
          : "No servers available"}
      </div>
    );
  }

  if (viewMode === "list") {
    return <ServerTable servers={filteredServers} />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredServers.map((server) => (
        <ServerCard
          key={server.name}
          server={server}
          serverUrl={server.remotes?.[0]?.url}
        />
      ))}
    </div>
  );
}
