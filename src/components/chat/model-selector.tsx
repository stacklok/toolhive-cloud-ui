"use client";

/**
 * Known hydration mismatch warning with Radix UI components (DropdownMenu, Tooltip).
 * This is a React 19.2 / Next.js 16+ bug, not a Radix issue.
 * The useId prefix changed in React 19.2, causing server/client ID mismatches.
 * @see https://github.com/radix-ui/primitives/issues/3700
 */

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { OpenRouterIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useModels } from "@/features/assistant";

/**
 * Extract display name from model ID (e.g., "anthropic/claude-3.5-sonnet" -> "claude-3.5-sonnet")
 */
const getDisplayName = (modelId: string): string => {
  if (modelId.includes("/")) {
    return modelId.split("/").pop() ?? modelId;
  }
  return modelId;
};

/**
 * Extract provider prefix from model ID (e.g., "anthropic/claude-3.5-sonnet" -> "anthropic")
 */
const getProviderPrefix = (modelId: string): string | null => {
  if (modelId.includes("/")) {
    return modelId.split("/")[0] ?? null;
  }
  return null;
};

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  const models = useModels();
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredModels = useMemo(() => {
    if (!searchQuery) return models;
    const query = searchQuery.toLowerCase();
    return models.filter((model) => model.toLowerCase().includes(query));
  }, [models, searchQuery]);

  const hasSearch = models.length > 20;

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && hasSearch) {
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        if (!open) {
          setSearchQuery("");
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 justify-between gap-2"
          disabled={disabled}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0">
                  <OpenRouterIcon className="size-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent>OpenRouter</TooltipContent>
            </Tooltip>
            {selectedModel ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex min-w-0 items-center font-mono text-sm">
                    <span className="text-muted-foreground">
                      {getProviderPrefix(selectedModel)}
                    </span>
                    <span className="text-muted-foreground mx-0.5">/</span>
                    <span className="max-w-48 truncate">
                      {getDisplayName(selectedModel)}
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{selectedModel}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-sm">Select Model</span>
            )}
          </div>
          <ChevronDown className="size-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-80"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <OpenRouterIcon className="size-4" />
          OpenRouter Models
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {hasSearch && (
          <div className="bg-background border-b p-2">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2 size-4" />
              <Input
                ref={inputRef}
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>
        )}

        <div className="max-h-[320px] min-h-0 overflow-y-auto">
          {filteredModels.length > 0 ? (
            filteredModels.map((model) => {
              const isSelected = selectedModel === model;
              const providerPrefix = getProviderPrefix(model);

              return (
                <DropdownMenuItem
                  key={model}
                  onClick={() => onModelChange(model)}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <div className="size-4 shrink-0">
                    {isSelected && (
                      <span className="text-primary text-sm">✓</span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-mono text-sm">
                      {getDisplayName(model)}
                    </span>
                    {providerPrefix && (
                      <span className="text-muted-foreground text-xs">
                        {providerPrefix}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })
          ) : (
            <div className="text-muted-foreground p-4 text-center text-sm">
              {searchQuery
                ? `No models found matching "${searchQuery}"`
                : "No models available"}
            </div>
          )}
        </div>

        {hasSearch && (
          <div className="bg-background shrink-0 border-t p-2">
            <p className="text-muted-foreground text-center text-xs">
              {searchQuery
                ? `${filteredModels.length} of ${models.length} models`
                : `${models.length} models available`}
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
