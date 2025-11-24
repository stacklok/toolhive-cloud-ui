"use client";

import { LayoutGrid, List, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(value) => {
          if (value) onViewModeChange(value as "grid" | "list");
        }}
      >
        <ToggleGroupItem value="list" aria-label="List view">
          <List className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" aria-label="Grid view">
          <LayoutGrid className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 px-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSearchChange("")}
            className="text-muted-foreground hover:text-foreground absolute
            top-1/2 right-1 size-7 -translate-y-1/2"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
