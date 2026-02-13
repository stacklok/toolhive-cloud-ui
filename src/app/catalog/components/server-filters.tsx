"use client";

import { LayoutGrid, List, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { GithubComStacklokToolhiveRegistryServerInternalServiceRegistryInfo } from "@/generated/types.gen";
import { ALL_REGISTRIES_VALUE } from "../hooks/use-catalog-filters";

interface ServerFiltersProps {
  registries: GithubComStacklokToolhiveRegistryServerInternalServiceRegistryInfo[];
  selectedRegistry: string;
  onRegistryChange: (registryName: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * Server filters component with registry selector, view mode toggle, and search
 */
export function ServerFilters({
  registries,
  selectedRegistry,
  onRegistryChange,
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
        spacing={1}
        className="gap-2"
      >
        <ToggleGroupItem
          value="list"
          aria-label="List view"
          className="size-11 rounded-md data-[state=on]:bg-accent data-[state=on]:shadow-none"
        >
          <List className="size-5" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="grid"
          aria-label="Grid view"
          className="size-11 rounded-md data-[state=on]:bg-accent data-[state=on]:shadow-none"
        >
          <LayoutGrid className="size-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <Select value={selectedRegistry} onValueChange={onRegistryChange}>
        <SelectTrigger
          className="w-38 h-9 bg-white dark:bg-card"
          aria-label="Select registry"
        >
          <SelectValue placeholder="All registries" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_REGISTRIES_VALUE}>All registries</SelectItem>
          {registries
            .filter(
              (registry): registry is typeof registry & { name: string } =>
                !!registry.name,
            )
            .map((registry) => (
              <SelectItem key={registry.name} value={registry.name}>
                {registry.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <div className="relative w-48">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 px-9 bg-white dark:bg-card"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSearchChange("")}
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
