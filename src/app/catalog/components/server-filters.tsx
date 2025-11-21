"use client";

import { LayoutGrid, List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ServerFiltersProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * Server filters component with view mode toggle and search functionality
 */
export function ServerFilters({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
}: ServerFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-9 items-center gap-2 px-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewModeChange("list")}
          aria-label="List view"
          className={cn("size-9", viewMode === "list" && "bg-accent")}
        >
          <List className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onViewModeChange("grid")}
          aria-label="Grid view"
          className={cn("size-9", viewMode === "grid" && "bg-accent")}
        >
          <LayoutGrid className="size-4" />
        </Button>
      </div>

      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 pl-9"
        />
      </div>
    </div>
  );
}
