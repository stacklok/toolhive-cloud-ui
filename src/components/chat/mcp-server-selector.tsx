"use client";

import { ChevronDown, Loader2, Settings2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMcpSettings, useMcpToolsFetch } from "@/features/assistant";
import { cn } from "@/lib/utils";
import { McpToolsModal } from "./mcp-tools-modal";

interface McpServerSelectorProps {
  disabled?: boolean;
}

export function McpServerSelector({
  disabled = false,
}: McpServerSelectorProps) {
  const {
    availableServers,
    selectedServers,
    toggleServer,
    deselectAllServers,
    enabledTools,
    totalEnabledToolsCount,
    selectedServersCount,
  } = useMcpSettings();

  const { isLoading } = useMcpToolsFetch();

  const [isOpen, setIsOpen] = useState(false);
  const [toolsModalOpen, setToolsModalOpen] = useState(false);
  const [selectedServerForTools, setSelectedServerForTools] = useState<
    string | null
  >(null);

  const getServerToolsCount = (serverName: string): number => {
    return enabledTools.get(serverName)?.size ?? 0;
  };

  const handleOpenToolsModal = (serverName: string) => {
    setSelectedServerForTools(serverName);
    setToolsModalOpen(true);
  };

  if (availableServers.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="gap-2 opacity-50"
          >
            <span className="text-sm">No MCP Servers</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>No MCP servers available</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex h-10 items-center justify-between gap-2"
            disabled={disabled}
          >
            <span>MCP Servers</span>
            <Badge variant="secondary">
              {selectedServersCount} Enabled / {totalEnabledToolsCount} Tools
            </Badge>
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          side="top"
          className="max-h-96 w-72"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuLabel>Available MCP Servers</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <ScrollArea>
            {availableServers.map((server) => {
              const serverName = server.name ?? "unknown";
              const isSelected = selectedServers.has(serverName);
              const toolsCount = getServerToolsCount(serverName);

              return (
                <DropdownMenuCheckboxItem
                  key={serverName}
                  checked={isSelected}
                  onCheckedChange={() => toggleServer(serverName)}
                  onSelect={(e) => e.preventDefault()}
                  className={cn("flex cursor-pointer items-center gap-3 py-1")}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="max-w-30 truncate font-normal">
                          {server.title ?? serverName}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{serverName}</TooltipContent>
                    </Tooltip>
                  </div>
                  {isSelected && (
                    <Badge
                      variant="outline"
                      className="bg-background/90 min-w-2 font-light"
                    >
                      {isLoading(serverName) ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        `${toolsCount} tools`
                      )}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenToolsModal(serverName);
                    }}
                  >
                    <Settings2 className="size-4" />
                  </Button>
                </DropdownMenuCheckboxItem>
              );
            })}
          </ScrollArea>

          {availableServers.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full cursor-pointer font-light"
                  onClick={deselectAllServers}
                  disabled={selectedServersCount === 0}
                >
                  Clear enabled servers
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <McpToolsModal
        open={toolsModalOpen && selectedServerForTools !== null}
        onOpenChange={setToolsModalOpen}
        serverName={selectedServerForTools ?? ""}
      />
    </>
  );
}
