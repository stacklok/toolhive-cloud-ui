"use client";

import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type OnConnect,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./vmcp-flow.css";

import { nodeTypes } from "./nodes";
import { ServerPalette } from "./server-palette";
import { VMCPPreviewPanel } from "./vmcp-preview-panel";
import type {
  MCPServerWithTools,
  MCPServerNodeData,
  OutputNodeData,
  VirtualMCPServerSpec,
} from "@/features/vmcp-builder/types";
import { toast } from "sonner";

// Initial output node
const initialNodes: Node[] = [
  {
    id: "output",
    type: "output",
    position: { x: 600, y: 200 },
    data: {
      name: "My Virtual MCP",
      description: "Aggregated MCP endpoint",
    } satisfies OutputNodeData,
  },
];

interface VMCPFlowEditorInnerProps {
  servers: MCPServerWithTools[];
}

/**
 * Inner component that uses React Flow hooks.
 */
function VMCPFlowEditorInner({ servers }: VMCPFlowEditorInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [yaml, setYaml] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  /** Type guard for MCPServerNodeData */
  const isMCPServerNodeData = (data: unknown): data is MCPServerNodeData => {
    return (
      typeof data === "object" &&
      data !== null &&
      "server" in data &&
      "selectedTools" in data
    );
  };

  /** Type guard for OutputNodeData */
  const isOutputNodeData = (data: unknown): data is OutputNodeData => {
    return typeof data === "object" && data !== null && "name" in data;
  };

  // Build spec from current flow state
  const buildSpec = useCallback((): VirtualMCPServerSpec | null => {
    const serverNodes = nodes.filter((n) => n.type === "mcpServer");

    if (serverNodes.length === 0) return null;

    const tools = serverNodes
      .map((node) => {
        if (!isMCPServerNodeData(node.data)) return null;
        const data = node.data;
        if (data.selectedTools.length === 0) return null;
        return {
          workload: data.server.name,
          filter: data.selectedTools,
        };
      })
      .filter(Boolean) as { workload: string; filter: string[] }[];

    if (tools.length === 0) return null;

    const outputNode = nodes.find((n) => n.type === "output");
    const outputData = isOutputNodeData(outputNode?.data)
      ? outputNode.data
      : undefined;

    return {
      name: outputData?.name?.toLowerCase().replace(/\s+/g, "-") ?? "my-vmcp",
      description: outputData?.description,
      groupName: "default-group",
      incomingAuth: { type: "anonymous" },
      aggregation: {
        conflictResolution: "prefix",
        tools,
      },
    };
  }, [nodes]);

  /** Generate YAML preview from spec (client-side for POC) */
  const generateYaml = useCallback(
    (spec: VirtualMCPServerSpec): string => {
      return `apiVersion: toolhive.stacklok.dev/v1alpha1
kind: VirtualMCPServer
metadata:
  name: ${spec.name}
  namespace: default
spec:
  groupRef:
    name: ${spec.groupName}
  incomingAuth:
    type: ${spec.incomingAuth.type}
  aggregation:
    conflictResolution: ${spec.aggregation.conflictResolution}
    tools:
${spec.aggregation.tools
  .map(
    (t) => `      - workload: ${t.workload}
        filter:
${t.filter.map((f) => `          - ${f}`).join("\n")}`,
  )
  .join("\n")}
  serviceType: ${spec.serviceType ?? "ClusterIP"}`;
    },
    [],
  );

  // Generate YAML preview when spec changes
  useEffect(() => {
    const spec = buildSpec();
    if (!spec) {
      setYaml(null);
      return;
    }

    // POC: Generate YAML client-side instead of fetching
    setYaml(generateYaml(spec));
  }, [buildSpec, generateYaml]);

  // Handle new connections
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges],
  );

  // Handle tool checkbox toggle - use ref for stable reference
  const handleToolToggleRef = useRef<(nodeId: string, toolName: string) => void>(
    () => {},
  );

  handleToolToggleRef.current = useCallback(
    (nodeId: string, toolName: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id !== nodeId) return node;
          if (!isMCPServerNodeData(node.data)) return node;

          const data = node.data;
          const isSelected = data.selectedTools.includes(toolName);

          return {
            ...node,
            data: {
              ...data,
              selectedTools: isSelected
                ? data.selectedTools.filter((t) => t !== toolName)
                : [...data.selectedTools, toolName],
            },
          };
        }),
      );
    },
    [setNodes],
  );

  // Stable callback that delegates to ref
  const handleToolToggle = useCallback(
    (nodeId: string, toolName: string) => {
      handleToolToggleRef.current(nodeId, toolName);
    },
    [],
  );

  // Handle dropping a server from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const serverData = event.dataTransfer.getData("application/json");
      if (!serverData) return;

      const server = JSON.parse(serverData) as MCPServerWithTools;

      // Check if server already exists
      const exists = nodes.some(
        (n) =>
          n.type === "mcpServer" &&
          isMCPServerNodeData(n.data) &&
          n.data.server.name === server.name,
      );

      if (exists) {
        toast.error(`${server.title} is already on the canvas`);
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeId = `server-${server.name}-${Date.now()}`;
      const newNode: Node = {
        id: nodeId,
        type: "mcpServer",
        position,
        data: {
          server,
          selectedTools: server.tools.map((t) => t.name), // Select all by default
          onToolToggle: handleToolToggle,
          nodeId,
        } satisfies MCPServerNodeData,
      };

      setNodes((nds) => [...nds, newNode]);

      // Auto-connect to output
      setEdges((eds) => [
        ...eds,
        {
          id: `edge-${newNode.id}-output`,
          source: newNode.id,
          target: "output",
          animated: true,
        },
      ]);

      toast.success(`Added ${server.title}`);
    },
    [nodes, setNodes, setEdges, screenToFlowPosition, handleToolToggle],
  );

  // Toggle tool selection in a server node
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type !== "mcpServer") return;

      // For POC, toggle all tools on/off on double-click
      // In production, this would open a modal for tool selection
    },
    [],
  );

  // Handle drag start from palette
  const onPaletteDragStart = useCallback(
    (event: React.DragEvent, server: MCPServerWithTools) => {
      event.dataTransfer.setData("application/json", JSON.stringify(server));
      event.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  // Handle deploy
  const handleDeploy = useCallback(async () => {
    const spec = buildSpec();
    if (!spec) {
      toast.error("No tools selected");
      return;
    }

    setIsDeploying(true);

    try {
      const res = await fetch("/api/vmcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec }),
      });

      if (!res.ok) throw new Error("Deploy failed");

      const vmcp = await res.json();
      toast.success(`Created vMCP: ${vmcp.name}`, {
        description: "Deployment is in progress...",
      });
    } catch {
      toast.error("Failed to deploy vMCP");
    } finally {
      setIsDeploying(false);
    }
  }, [buildSpec]);

  // Expose tool toggle to nodes
  useEffect(() => {
    // Store handler in window for node access (POC approach)
    (window as unknown as { __vmcpToolToggle?: typeof handleToolToggle }).__vmcpToolToggle = handleToolToggle;
    return () => {
      delete (window as unknown as { __vmcpToolToggle?: typeof handleToolToggle }).__vmcpToolToggle;
    };
  }, [handleToolToggle]);

  const spec = buildSpec();

  return (
    <div className="flex h-full">
      {/* Left sidebar - Server palette */}
      <div className="w-64 shrink-0">
        <ServerPalette servers={servers} onDragStart={onPaletteDragStart} />
      </div>

      {/* Center - Flow canvas */}
      <div ref={reactFlowWrapper} className="flex-1 bg-muted/30">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
        >
          <Background gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === "output") return "hsl(var(--primary))";
              return "hsl(var(--muted-foreground))";
            }}
            className="!bg-card !border-border"
          />
        </ReactFlow>
      </div>

      {/* Right sidebar - Preview */}
      <div className="w-80 shrink-0">
        <VMCPPreviewPanel
          spec={spec}
          yaml={yaml}
          isLoading={isDeploying}
          onDeploy={handleDeploy}
        />
      </div>
    </div>
  );
}

interface VMCPFlowEditorProps {
  servers: MCPServerWithTools[];
}

/**
 * Main vMCP Flow Editor component.
 * Wrapped in ReactFlowProvider for hook access.
 */
export function VMCPFlowEditor({ servers }: VMCPFlowEditorProps) {
  return (
    <ReactFlowProvider>
      <VMCPFlowEditorInner servers={servers} />
    </ReactFlowProvider>
  );
}

