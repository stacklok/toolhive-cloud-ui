"use client";

import type { MCPServerWithTools } from "@/features/vmcp-builder/types";
import { GripVertical, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServiceIcon } from "./service-icon";

interface ServerPaletteProps {
  servers: MCPServerWithTools[];
  onDragStart: (
    event: React.DragEvent,
    server: MCPServerWithTools,
  ) => void;
}

/**
 * Palette of available MCP servers that can be dragged onto the canvas.
 */
export function ServerPalette({ servers, onDragStart }: ServerPaletteProps) {
  const [search, setSearch] = useState("");

  const filteredServers = servers.filter(
    (server) =>
      server.title.toLowerCase().includes(search.toLowerCase()) ||
      server.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm mb-3">MCP Servers</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search servers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Server list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredServers.map((server) => (
            <div
              key={server.name}
              draggable
              onDragStart={(e) => onDragStart(e, server)}
              className="
                flex items-center gap-3 p-3 rounded-lg border border-border
                bg-background cursor-grab active:cursor-grabbing
                hover:border-primary/50 hover:bg-muted/50 transition-colors
                select-none
              "
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <ServiceIcon
                  iconName={server.iconName}
                  iconUrl={server.iconUrl}
                  alt={server.title}
                  className="h-5 w-5 text-muted-foreground"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{server.title}</p>
                <p className="text-xs text-muted-foreground">
                  {server.tools.length} tools
                </p>
              </div>
            </div>
          ))}

          {filteredServers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No servers found
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Help text */}
      <div className="p-3 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Drag servers to the canvas to add them
        </p>
      </div>
    </div>
  );
}

