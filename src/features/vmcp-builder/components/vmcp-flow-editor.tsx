"use client";

import {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type OnConnect,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import "@xyflow/react/dist/style.css";
import "./vmcp-flow.css";

import { toast } from "sonner";
import type {
  MCPServerNodeData,
  MCPServerWithTools,
  OutputNodeData,
  VirtualMCPServerSpec,
} from "@/features/vmcp-builder/types";
import { nodeTypes } from "./nodes";
import { ServerPalette } from "./server-palette";
import { VMCPPreviewPanel } from "./vmcp-preview-panel";

/**
 * Imperative handle for controlling the flow editor from parent components
 */
export interface FlowEditorHandle {
  /** Add a server to the canvas */
  addServer: (serverName: string, selectedTools?: string[]) => void;
  /** Remove a server from the canvas */
  removeServer: (serverName: string) => void;
  /** Select specific tools for a server */
  selectTools: (serverName: string, tools: string[]) => void;
  /** Deselect specific tools for a server */
  deselectTools: (serverName: string, tools: string[]) => void;
  /** Get the current state of the editor */
  getState: () => {
    servers: Array<{ name: string; selectedTools: string[] }>;
    yaml: string | null;
  };
}

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

/** Initial server configuration from the AI */
interface InitialServerConfig {
  name: string;
  tools: string[];
}

interface VMCPFlowEditorInnerProps {
  servers: MCPServerWithTools[];
  /** Initial servers to pre-populate the canvas */
  initialServers?: InitialServerConfig[];
  /** vMCP name for the output node */
  vmcpName?: string;
  /** vMCP description for the output node */
  vmcpDescription?: string;
  /** Called when YAML content changes */
  onYamlChange?: (yaml: string | null) => void;
  /** Whether the editor is embedded in an artifact (hides sidebar) */
  embedded?: boolean;
}

/**
 * Inner component that uses React Flow hooks.
 */
const VMCPFlowEditorInner = forwardRef<
  FlowEditorHandle,
  VMCPFlowEditorInnerProps
>(function VMCPFlowEditorInner(
  {
    servers,
    initialServers,
    vmcpName,
    vmcpDescription,
    onYamlChange,
    embedded = false,
  },
  ref
) {
  // Track if we've initialized with initial servers
  const initializedRef = useRef(false);
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
  const generateYaml = useCallback((spec: VirtualMCPServerSpec): string => {
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
${t.filter.map((f) => `          - ${f}`).join("\n")}`
  )
  .join("\n")}
  serviceType: ${spec.serviceType ?? "ClusterIP"}`;
  }, []);

  // Generate YAML preview when spec changes
  useEffect(() => {
    const spec = buildSpec();
    if (!spec) {
      setYaml(null);
      onYamlChange?.(null);
      return;
    }

    // POC: Generate YAML client-side instead of fetching
    const generatedYaml = generateYaml(spec);
    setYaml(generatedYaml);
    onYamlChange?.(generatedYaml);
  }, [buildSpec, generateYaml, onYamlChange]);

  // Handle new connections
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges]
  );

  // Handle tool checkbox toggle - use ref for stable reference
  const handleToolToggleRef = useRef<
    (nodeId: string, toolName: string) => void
  >(() => {});

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
        })
      );
    },
    [setNodes]
  );

  // Stable callback that delegates to ref
  const handleToolToggle = useCallback((nodeId: string, toolName: string) => {
    handleToolToggleRef.current(nodeId, toolName);
  }, []);

  // Initialize canvas with initial servers from AI
  useEffect(() => {
    if (
      initializedRef.current ||
      !initialServers ||
      initialServers.length === 0 ||
      servers.length === 0
    ) {
      return;
    }

    initializedRef.current = true;
    console.log("[VMCPFlowEditor] Initializing with servers:", initialServers);

    // Create nodes for each initial server
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    initialServers.forEach((initialServer, index) => {
      const server = servers.find((s) => s.name === initialServer.name);
      if (!server) {
        console.warn(
          `[VMCPFlowEditor] Server not found: ${initialServer.name}`
        );
        return;
      }

      const nodeId = `server-${server.name}-${Date.now()}-${index}`;
      const yOffset = index * 200;

      newNodes.push({
        id: nodeId,
        type: "mcpServer",
        position: { x: 100, y: 80 + yOffset },
        data: {
          server,
          selectedTools: initialServer.tools,
          onToolToggle: handleToolToggle,
          nodeId,
        } satisfies MCPServerNodeData,
      });

      newEdges.push({
        id: `edge-${nodeId}-output`,
        source: nodeId,
        target: "output",
        animated: true,
      });
    });

    // Update output node with vMCP name/description
    setNodes((nds) => {
      const outputNode = nds.find((n) => n.id === "output");
      if (outputNode && isOutputNodeData(outputNode.data)) {
        const updatedOutput: Node = {
          ...outputNode,
          data: {
            ...outputNode.data,
            name: vmcpName ?? "My Virtual MCP",
            description: vmcpDescription ?? "Aggregated MCP endpoint",
          } satisfies OutputNodeData,
        };
        return [
          ...nds.filter((n) => n.id !== "output"),
          updatedOutput,
          ...newNodes,
        ];
      }
      return [...nds, ...newNodes];
    });

    setEdges((eds) => [...eds, ...newEdges]);

    toast.success(`Initialized with ${newNodes.length} server(s)`);
  }, [
    initialServers,
    servers,
    vmcpName,
    vmcpDescription,
    handleToolToggle,
    setNodes,
    setEdges,
  ]);

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
          n.data.server.name === server.name
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
    [nodes, setNodes, setEdges, screenToFlowPosition, handleToolToggle]
  );

  // Toggle tool selection in a server node
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type !== "mcpServer") return;

    // For POC, toggle all tools on/off on double-click
    // In production, this would open a modal for tool selection
  }, []);

  // Handle drag start from palette
  const onPaletteDragStart = useCallback(
    (event: React.DragEvent, server: MCPServerWithTools) => {
      event.dataTransfer.setData("application/json", JSON.stringify(server));
      event.dataTransfer.effectAllowed = "move";
    },
    []
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
    (
      window as unknown as { __vmcpToolToggle?: typeof handleToolToggle }
    ).__vmcpToolToggle = handleToolToggle;
    return () => {
      delete (
        window as unknown as { __vmcpToolToggle?: typeof handleToolToggle }
      ).__vmcpToolToggle;
    };
  }, [handleToolToggle]);

  // Imperative methods for AI control
  useImperativeHandle(
    ref,
    () => ({
      addServer: (serverName: string, selectedTools?: string[]) => {
        const server = servers.find((s) => s.name === serverName);
        if (!server) {
          toast.error(`Server "${serverName}" not found`);
          return;
        }

        // Check if already exists
        const exists = nodes.some(
          (n) =>
            n.type === "mcpServer" &&
            isMCPServerNodeData(n.data) &&
            n.data.server.name === serverName
        );

        if (exists) {
          toast.info(`${server.title} is already on the canvas`);
          return;
        }

        // Calculate position for new node
        const existingServerNodes = nodes.filter((n) => n.type === "mcpServer");
        const yOffset = existingServerNodes.length * 180;

        const nodeId = `server-${server.name}-${Date.now()}`;
        const newNode: Node = {
          id: nodeId,
          type: "mcpServer",
          position: { x: 100, y: 100 + yOffset },
          data: {
            server,
            selectedTools: selectedTools ?? server.tools.map((t) => t.name),
            onToolToggle: handleToolToggle,
            nodeId,
          } satisfies MCPServerNodeData,
        };

        setNodes((nds) => [...nds, newNode]);
        setEdges((eds) => [
          ...eds,
          {
            id: `edge-${newNode.id}-output`,
            source: newNode.id,
            target: "output",
            animated: true,
          },
        ]);
      },

      removeServer: (serverName: string) => {
        setNodes((nds) =>
          nds.filter((n) => {
            if (n.type !== "mcpServer") return true;
            if (!isMCPServerNodeData(n.data)) return true;
            return n.data.server.name !== serverName;
          })
        );
        setEdges((eds) =>
          eds.filter((e) => !e.source.includes(`server-${serverName}`))
        );
      },

      selectTools: (serverName: string, tools: string[]) => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.type !== "mcpServer") return node;
            if (!isMCPServerNodeData(node.data)) return node;
            if (node.data.server.name !== serverName) return node;

            const currentTools = new Set(node.data.selectedTools);
            for (const tool of tools) {
              currentTools.add(tool);
            }

            return {
              ...node,
              data: {
                ...node.data,
                selectedTools: Array.from(currentTools),
              },
            };
          })
        );
      },

      deselectTools: (serverName: string, tools: string[]) => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.type !== "mcpServer") return node;
            if (!isMCPServerNodeData(node.data)) return node;
            if (node.data.server.name !== serverName) return node;

            const toolsToRemove = new Set(tools);
            return {
              ...node,
              data: {
                ...node.data,
                selectedTools: node.data.selectedTools.filter(
                  (t) => !toolsToRemove.has(t)
                ),
              },
            };
          })
        );
      },

      getState: () => {
        const serverNodes = nodes.filter((n) => n.type === "mcpServer");
        const serverStates = serverNodes
          .map((n) => {
            if (!isMCPServerNodeData(n.data)) return null;
            return {
              name: n.data.server.name,
              selectedTools: n.data.selectedTools,
            };
          })
          .filter(Boolean) as Array<{ name: string; selectedTools: string[] }>;

        return {
          servers: serverStates,
          yaml,
        };
      },
    }),
    [servers, nodes, yaml, handleToolToggle, setNodes, setEdges]
  );

  const spec = buildSpec();

  return (
    <div className="flex h-full">
      {/* Left sidebar - Server palette */}
      {!embedded && (
        <div className="w-64 shrink-0">
          <ServerPalette servers={servers} onDragStart={onPaletteDragStart} />
        </div>
      )}

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
          {!embedded && (
            <MiniMap
              nodeColor={(node) => {
                if (node.type === "output") return "hsl(var(--primary))";
                return "hsl(var(--muted-foreground))";
              }}
              className="!bg-card !border-border"
            />
          )}
        </ReactFlow>
      </div>

      {/* Right sidebar - Preview (only in standalone mode) */}
      {!embedded && (
        <div className="w-80 shrink-0">
          <VMCPPreviewPanel
            spec={spec}
            yaml={yaml}
            isLoading={isDeploying}
            onDeploy={handleDeploy}
          />
        </div>
      )}

      {/* Floating palette for embedded mode */}
      {embedded && (
        <div className="absolute left-4 top-4 z-10 w-56 rounded-lg border border-border bg-card shadow-lg">
          <ServerPalette
            servers={servers}
            onDragStart={onPaletteDragStart}
            compact
          />
        </div>
      )}
    </div>
  );
});

interface VMCPFlowEditorProps {
  servers: MCPServerWithTools[];
  /** Initial servers to pre-populate the canvas */
  initialServers?: InitialServerConfig[];
  /** vMCP name for the output node */
  vmcpName?: string;
  /** vMCP description for the output node */
  vmcpDescription?: string;
  /** Called when YAML content changes */
  onYamlChange?: (yaml: string | null) => void;
  /** Whether the editor is embedded in an artifact (compact mode) */
  embedded?: boolean;
}

/**
 * Main vMCP Flow Editor component.
 * Wrapped in ReactFlowProvider for hook access.
 */
export const VMCPFlowEditor = forwardRef<FlowEditorHandle, VMCPFlowEditorProps>(
  function VMCPFlowEditor(
    {
      servers,
      initialServers,
      vmcpName,
      vmcpDescription,
      onYamlChange,
      embedded,
    },
    ref
  ) {
    return (
      <ReactFlowProvider>
        <VMCPFlowEditorInner
          ref={ref}
          servers={servers}
          initialServers={initialServers}
          vmcpName={vmcpName}
          vmcpDescription={vmcpDescription}
          onYamlChange={onYamlChange}
          embedded={embedded}
        />
      </ReactFlowProvider>
    );
  }
);
