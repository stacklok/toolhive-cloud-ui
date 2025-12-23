"use client";

import type { MCPServerWithTools, MCPTool } from "@/features/vmcp-builder/types";
import { GripVertical, Search, ChevronDown, ChevronRight, Wrench } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServiceIcon } from "./service-icon";

interface ToolPaletteProps {
  servers: MCPServerWithTools[];
  onDragStart: (
    event: React.DragEvent,
    server: MCPServerWithTools,
    tool: MCPTool,
  ) => void;
}

/**
 * Palette of available tools that can be dragged onto the workflow canvas.
 * Tools are grouped by server.
 */
export function ToolPalette({ servers, onDragStart }: ToolPaletteProps) {
  const [search, setSearch] = useState("");
  const [expandedServers, setExpandedServers] = useState<Set<string>>(
    new Set(servers.map((s) => s.name)),
  );

  const filteredServers = servers.filter(
    (server) =>
      server.title.toLowerCase().includes(search.toLowerCase()) ||
      server.name.toLowerCase().includes(search.toLowerCase()) ||
      server.tools.some((tool) =>
        tool.name.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  const toggleServer = (serverName: string) => {
    const newExpanded = new Set(expandedServers);
    if (newExpanded.has(serverName)) {
      newExpanded.delete(serverName);
    } else {
      newExpanded.add(serverName);
    }
    setExpandedServers(newExpanded);
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm mb-3">Available Tools</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Tool list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredServers.map((server) => {
            const isExpanded = expandedServers.has(server.name);
            const filteredTools = server.tools.filter(
              (tool) =>
                tool.name.toLowerCase().includes(search.toLowerCase()) ||
                tool.description.toLowerCase().includes(search.toLowerCase()),
            );

            if (filteredTools.length === 0) return null;

            return (
              <div key={server.name} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleServer(server.name)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors w-full text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted shrink-0">
                    <ServiceIcon
                      iconName={server.iconName}
                      iconUrl={server.iconUrl}
                      alt={server.title}
                      className="h-4 w-4 text-muted-foreground"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {server.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {filteredTools.length} tool
                      {filteredTools.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {filteredTools.map((tool) => (
                      <div
                        key={`${server.name}-${tool.name}`}
                        draggable
                        onDragStart={(e) => onDragStart(e, server, tool)}
                        className="
                          flex items-center gap-2 p-2 rounded-md border border-border
                          bg-background cursor-grab active:cursor-grabbing
                          hover:border-primary/50 hover:bg-muted/50 transition-colors
                          select-none
                        "
                      >
                        <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                        <Wrench className="h-3 w-3 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {tool.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {filteredServers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tools found
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Help text */}
      <div className="p-3 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Drag tools to create workflows
        </p>
      </div>
    </div>
  );
}

