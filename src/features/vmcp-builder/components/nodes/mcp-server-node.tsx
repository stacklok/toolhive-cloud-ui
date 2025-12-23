"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { MCPServerNodeData } from "@/features/vmcp-builder/types";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Wrench } from "lucide-react";
import { ServiceIcon } from "../service-icon";

/** Node type for MCP Server nodes */
type MCPServerNode = Node<MCPServerNodeData, "mcpServer">;

/**
 * Custom node component for MCP Server in the flow editor.
 * Displays server info and allows selecting which tools to include.
 */
function MCPServerNodeComponent({
  id,
  data,
  selected,
}: NodeProps<MCPServerNode>) {
  const { server, selectedTools, onToolToggle } = data;
  const allSelected = selectedTools.length === server.tools.length;
  const someSelected = selectedTools.length > 0 && !allSelected;

  const handleToolClick = useCallback(
    (toolName: string) => {
      if (onToolToggle) {
        onToolToggle(id, toolName);
      }
    },
    [id, onToolToggle],
  );

  return (
    <div
      className={`
        min-w-[280px] rounded-xl border-2 shadow-lg transition-all
        bg-zinc-900 text-zinc-100
        ${selected ? "border-primary ring-2 ring-primary/20" : "border-zinc-700"}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-700 bg-zinc-800/50 px-4 py-3 rounded-t-xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <ServiceIcon
            iconName={server.iconName}
            iconUrl={server.iconUrl}
            alt={server.title}
            className="h-5 w-5 text-primary"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate text-zinc-100">
            {server.title}
          </h3>
          <p className="text-xs text-zinc-400 truncate">v{server.version}</p>
        </div>
        <Badge variant="secondary" className="shrink-0 bg-zinc-700 text-zinc-200">
          {selectedTools.length}/{server.tools.length}
        </Badge>
      </div>

      {/* Tools list - nodrag class prevents React Flow from capturing drag events */}
      <div className="p-3 space-y-1.5 max-h-[200px] overflow-y-auto nodrag">
        {server.tools.map((tool) => {
          const isSelected = selectedTools.includes(tool.name);
          return (
            <button
              key={tool.name}
              type="button"
              onClick={() => handleToolClick(tool.name)}
              className={`
                flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors w-full text-left
                ${isSelected ? "bg-primary/20" : "hover:bg-zinc-800"}
              `}
            >
              <Checkbox
                checked={isSelected}
                className="pointer-events-none border-zinc-500 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                aria-label={`Select ${tool.name}`}
              />
              <Wrench className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="text-sm truncate flex-1 text-zinc-200">
                {tool.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer with selection status */}
      <div className="px-4 py-2 border-t border-zinc-700 bg-zinc-800/30 rounded-b-xl">
        <p className="text-xs text-zinc-400">
          {allSelected
            ? "All tools selected"
            : someSelected
              ? `${selectedTools.length} tools selected`
              : "No tools selected"}
        </p>
      </div>

      {/* Output handle - connects to other nodes */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-900"
      />
    </div>
  );
}

export const MCPServerNode = memo(MCPServerNodeComponent);

