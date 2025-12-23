"use client";

import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import type {
  MCPServerWithTools,
  ToolNodeData,
} from "@/features/vmcp-builder/types";
import { ServiceIcon } from "../service-icon";

/** Node type for Tool nodes */
type ToolNode = Node<ToolNodeData, "tool">;

interface ToolNodeComponentProps extends NodeProps<ToolNode> {
  servers: MCPServerWithTools[];
}

/**
 * Custom node component for individual tools in workflow editor.
 * Represents a single tool from an MCP server.
 */
function ToolNodeComponent({
  data,
  selected,
  servers,
}: ToolNodeComponentProps) {
  const { serverName, tool } = data;
  const server = servers.find((s) => s.name === serverName);

  return (
    <div
      className={`
        min-w-[200px] rounded-xl border-2 shadow-lg transition-all
        bg-zinc-900 text-zinc-100
        ${selected ? "border-primary ring-2 ring-primary/20" : "border-zinc-700"}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-700 bg-zinc-800/50 px-3 py-2 rounded-t-xl">
        {server && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <ServiceIcon
              iconName={server.iconName}
              iconUrl={server.iconUrl}
              alt={server.title}
              className="h-4 w-4 text-primary"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-400 truncate">{server?.title}</p>
          <h3 className="font-semibold text-sm truncate text-zinc-100">
            {tool.name}
          </h3>
        </div>
      </div>

      {/* Description */}
      <div className="px-3 py-2">
        <p className="text-xs text-zinc-400 line-clamp-2">{tool.description}</p>
      </div>

      {/* Handles - Allow connections from/to any direction */}
      {/* Target handles - can receive connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-900"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-900"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-900"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-900"
      />
      {/* Source handles - can send connections */}
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-900"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-900"
      />
    </div>
  );
}

export const ToolNode = memo(ToolNodeComponent);
