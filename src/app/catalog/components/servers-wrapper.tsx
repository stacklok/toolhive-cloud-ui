"use client";

import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { PageHeader } from "@/components/header-page";
import type { V0ServerJson } from "@/generated/types.gen";
import { ServerFilters } from "./server-filters";
import { Servers } from "./servers";

interface ServersWrapperProps {
  servers: V0ServerJson[];
}

const VIEW_MODES = ["grid", "list"] as const;

/**
 * Wrapper that manages shared state between filters and view
 * State is persisted in URL query parameters for shareable links
 */
export function ServersWrapper({ servers }: ServersWrapperProps) {
  const [{ viewMode, search }, setFilters] = useQueryStates(
    {
      viewMode: parseAsStringLiteral(VIEW_MODES).withDefault("grid"),
      search: parseAsString.withDefault(""),
    },
    {
      shallow: false,
    },
  );

  const handleViewModeChange = (newViewMode: "grid" | "list") => {
    setFilters({ viewMode: newViewMode });
  };

  const handleSearchChange = (newSearch: string) => {
    setFilters({ search: newSearch });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="MCP Server Catalog">
        <ServerFilters
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          searchQuery={search}
          onSearchChange={handleSearchChange}
        />
      </PageHeader>

      <div className="flex-1 overflow-auto">
        <Servers
          servers={servers}
          viewMode={viewMode}
          searchQuery={search}
        />
      </div>
    </div>
  );
}
