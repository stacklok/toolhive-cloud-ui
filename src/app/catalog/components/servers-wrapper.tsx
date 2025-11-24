"use client";

import { useState } from "react";
import { PageHeader } from "@/components/header-page";
import type { V0ServerJson } from "@/generated/types.gen";
import { ServerFilters } from "./server-filters";
import { Servers } from "./servers";

interface ServersWrapperProps {
  servers: V0ServerJson[];
}

/**
 * Wrapper that manages shared state between filters and view
 */
export function ServersWrapper({ servers }: ServersWrapperProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="MCP Server Catalog">
        <ServerFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </PageHeader>

      <div className="flex-1 overflow-auto pr-4">
        <Servers
          servers={servers}
          viewMode={viewMode}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}
