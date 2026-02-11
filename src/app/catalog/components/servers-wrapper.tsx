"use client";

import { PageHeader } from "@/components/header-page";
import type {
  GithubComStacklokToolhiveRegistryServerInternalServiceRegistryInfo,
  V0ServerJson,
} from "@/generated/types.gen";
import { useCatalogFilters } from "../hooks/use-catalog-filters";
import { ServerFilters } from "./server-filters";
import { Servers } from "./servers";

interface ServersWrapperProps {
  servers: V0ServerJson[];
  registries: GithubComStacklokToolhiveRegistryServerInternalServiceRegistryInfo[];
}

/**
 * Wrapper that connects catalog filters to the server list view.
 */
export function ServersWrapper({ servers, registries }: ServersWrapperProps) {
  const {
    viewMode,
    search,
    selectedRegistry,
    handleViewModeChange,
    handleSearchChange,
    handleClearSearch,
    handleRegistryChange,
  } = useCatalogFilters();

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="MCP Server Catalog">
        <ServerFilters
          registries={registries}
          selectedRegistry={selectedRegistry}
          onRegistryChange={handleRegistryChange}
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
          onClearSearch={handleClearSearch}
        />
      </div>
    </div>
  );
}
