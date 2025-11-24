"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { V0ServerJson } from "@/generated/types.gen";
import { ServerCard } from "./server-card";
import { ServersTable } from "./servers-table";

interface ServersProps {
  servers: V0ServerJson[];
  viewMode: "grid" | "list";
  searchQuery: string;
}

/**
 * Client component that displays filtered servers based on view mode and search query
 */
export function Servers({ servers, viewMode, searchQuery }: ServersProps) {
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
    const encodedName = encodeURIComponent(server.name || "");
    const detailUrl = `/catalog/${encodedName}/${server.version || "latest"}`;
    router.push(detailUrl);
  };

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
    <div className="grid grid-cols-1 gap-6 pb-6 md:grid-cols-2 lg:grid-cols-3">
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
