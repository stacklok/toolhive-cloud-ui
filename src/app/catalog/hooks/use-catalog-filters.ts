import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

export const ALL_REGISTRIES_VALUE = "all";
const VIEW_MODES = ["grid", "list"] as const;

/**
 * Manages catalog filter state persisted in URL query parameters.
 * Uses static defaults so that nuqs never strips params that match
 * a dynamic default (which caused registry to disappear on view-mode change).
 * NuqsAdapter handles SSR hydration, so no initial value prop is needed.
 */
export function useCatalogFilters() {
  const [{ viewMode, search, registryName }, setFilters] = useQueryStates(
    {
      viewMode: parseAsStringLiteral(VIEW_MODES).withDefault("grid"),
      search: parseAsString.withDefault(""),
      registryName: parseAsString.withDefault(""),
    },
    {
      shallow: false,
    },
  );

  const handleViewModeChange = (newViewMode: "grid" | "list") => {
    setFilters((prev) => ({ ...prev, viewMode: newViewMode }));
  };

  const handleSearchChange = (newSearch: string) => {
    setFilters((prev) => ({ ...prev, search: newSearch }));
  };

  const handleClearSearch = () => {
    setFilters((prev) => ({ ...prev, search: "" }));
  };

  const handleRegistryChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      registryName: value === ALL_REGISTRIES_VALUE ? null : value,
    }));
  };

  return {
    viewMode,
    search,
    selectedRegistry: registryName || ALL_REGISTRIES_VALUE,
    handleViewModeChange,
    handleSearchChange,
    handleClearSearch,
    handleRegistryChange,
  };
}
