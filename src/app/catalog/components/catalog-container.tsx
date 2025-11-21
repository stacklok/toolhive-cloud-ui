"use client";

import { useState } from "react";
import { HeaderPage } from "@/components/header-page";
import type { V0ServerJson } from "@/generated/types.gen";
import { CatalogFilters } from "./catalog-filters";
import { CatalogView } from "./catalog-view";

interface CatalogContainerProps {
  servers: V0ServerJson[];
}

/**
 * Container that manages shared state between filters and view
 */
export function CatalogContainer({ servers }: CatalogContainerProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <HeaderPage title="MCP Server Catalog">
        <CatalogFilters
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </HeaderPage>

      <CatalogView
        servers={servers}
        viewMode={viewMode}
        searchQuery={searchQuery}
      />
    </>
  );
}
