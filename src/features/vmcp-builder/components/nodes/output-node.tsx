"use client";

import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { Layers, Zap } from "lucide-react";
import { memo } from "react";
import type { OutputNodeData } from "@/features/vmcp-builder/types";

/** Node type for Output nodes */
type OutputNode = Node<OutputNodeData, "output">;

/**
 * Output node representing the aggregated vMCP endpoint.
 * This is where all selected tools are combined.
 */
function OutputNodeComponent({ data, selected }: NodeProps<OutputNode>) {
  return (
    <div
      className={`
        min-w-[240px] rounded-xl border-2 shadow-lg transition-all
        bg-zinc-800 text-zinc-100
        ${selected ? "border-primary ring-2 ring-primary/20" : "border-zinc-600"}
      `}
    >
      {/* Input handles - Allow connections from any direction */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-800"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-800"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-800"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-3 !h-3 !bg-primary !border-2 !border-zinc-800"
      />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-700">
          <Layers className="h-6 w-6 text-zinc-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-base text-zinc-100">
            {data.name || "Virtual MCP"}
          </h3>
          <p className="text-xs text-zinc-400">
            {data.description || "Aggregated endpoint"}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <span>Connect MCP servers to aggregate tools</span>
        </div>
      </div>
    </div>
  );
}

export const OutputNode = memo(OutputNodeComponent);
