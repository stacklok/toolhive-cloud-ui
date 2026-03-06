"use client";

import { PageHeader } from "@/components/header-page";
import type {
  GithubComStacklokToolhiveRegistryServerInternalServiceRegistryInfo,
  V0ServerJson,
} from "@/generated/types.gen";
import { useCatalogFilters } from "../hooks/use-catalog-filters";
import { CatalogPagination } from "./catalog-pagination";
import { ServerFilters } from "./server-filters";
import { ServerListSkeleton } from "./server-list-skeleton";
import { Servers } from "./servers";

interface ServersWrapperProps {
  servers: V0ServerJson[];
  registries: GithubComStacklokToolhiveRegistryServerInternalServiceRegistryInfo[];
  nextCursor?: string;
}

/**
 * Wrapper that connects catalog filters and pagination to the server list view.
 */
export function ServersWrapper({
  servers,
  registries,
  nextCursor,
}: ServersWrapperProps) {
  const {
    viewMode,
    search,
    selectedRegistry,
    limit,
    isFirstPage,
    isPending,
    pageNumber,
    handleViewModeChange,
    handleSearchChange,
    handleClearSearch,
    handleRegistryChange,
    handleNextPage,
    handlePrevPage,
    handleFirstPage,
    handleLimitChange,
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
        {isPending ? (
          <ServerListSkeleton />
        ) : (
          <Servers
            servers={servers}
            viewMode={viewMode}
            searchQuery={search}
            onClearSearch={handleClearSearch}
          />
        )}
      </div>

      <CatalogPagination
        isFirstPage={isFirstPage}
        nextCursor={nextCursor}
        limit={limit}
        pageNumber={pageNumber}
        onFirstPage={handleFirstPage}
        onPrev={handlePrevPage}
        onNext={handleNextPage}
        onLimitChange={handleLimitChange}
      />
    </div>
  );
}
