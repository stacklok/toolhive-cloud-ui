import {
  debounce,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import {
  CATALOG_ALL_REGISTRIES,
  CATALOG_PAGE_SIZE,
  CATALOG_VIEW_MODES,
} from "../constants";
import { useSessionStack } from "./use-session-stack";

/**
 * Manages catalog filter state persisted in URL query parameters.
 * prevCursors is stored in sessionStorage (per-tab, survives refresh)
 * rather than the URL since it's local navigation history, not shareable state.
 */
export function useCatalogFilters() {
  const [{ viewMode, search, registryName, cursor, limit }, setFilters] =
    useQueryStates(
      {
        viewMode: parseAsStringLiteral(CATALOG_VIEW_MODES).withDefault("grid"),
        search: parseAsString.withDefault(""),
        registryName: parseAsString.withDefault(""),
        cursor: parseAsString.withDefault(""),
        limit: parseAsInteger.withDefault(CATALOG_PAGE_SIZE),
      },
      {
        shallow: false,
      },
    );

  const { push, pop, clear } = useSessionStack();

  const handleViewModeChange = (newViewMode: "grid" | "list") => {
    setFilters((prev) => ({ ...prev, viewMode: newViewMode }));
  };

  const handleSearchChange = (newSearch: string) => {
    clear();
    setFilters((prev) => ({ ...prev, search: newSearch, cursor: "" }), {
      limitUrlUpdates: debounce(500),
    });
  };

  const handleClearSearch = () => {
    clear();
    setFilters((prev) => ({ ...prev, search: "", cursor: "" }));
  };

  const handleRegistryChange = (value: string) => {
    clear();
    setFilters((prev) => ({
      ...prev,
      registryName: value === CATALOG_ALL_REGISTRIES ? null : value,
      cursor: "",
    }));
  };

  const handleNextPage = (nextCursor: string) => {
    push(cursor);
    setFilters((prev) => ({ ...prev, cursor: nextCursor }));
  };

  const handlePrevPage = () => {
    const restored = pop();
    setFilters((prev) => ({ ...prev, cursor: restored }));
  };

  const handleLimitChange = (newLimit: number) => {
    clear();
    setFilters((prev) => ({ ...prev, limit: newLimit, cursor: "" }));
  };

  const isFirstPage = cursor === "";

  return {
    viewMode,
    search,
    selectedRegistry: registryName || CATALOG_ALL_REGISTRIES,
    cursor,
    limit,
    isFirstPage,
    handleViewModeChange,
    handleSearchChange,
    handleClearSearch,
    handleRegistryChange,
    handleNextPage,
    handlePrevPage,
    handleLimitChange,
  };
}
