"use client";

import { useCallback, useState, useRef, useEffect } from "react";
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
  type NodeProps,
  type OnConnect,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./vmcp-flow.css";

import { ToolPalette } from "./tool-palette";
import { VMCPPreviewPanel } from "./vmcp-preview-panel";
import type {
  MCPServerWithTools,
  ToolNodeData,
  OutputNodeData,
  VirtualMCPServerSpec,
  MCPTool,
} from "@/features/vmcp-builder/types";
import { toast } from "sonner";
import { ToolNode } from "./nodes/tool-node";
import { OutputNode } from "./nodes/output-node";

// Initial output node for workflow
const initialWorkflowNodes: Node[] = [
  {
    id: "output",
    type: "output",
    position: { x: 600, y: 200 },
    data: {
      name: "My Workflow",
      description: "Composite tool workflow",
    } satisfies OutputNodeData,
  },
];

interface WorkflowEditorInnerProps {
  servers: MCPServerWithTools[];
}

/**
 * Inner component that uses React Flow hooks for workflow editor.
 */
function WorkflowEditorInner({ servers }: WorkflowEditorInnerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialWorkflowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [yaml, setYaml] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  // Build workflow spec from current flow state
  const buildWorkflowSpec = useCallback((): VirtualMCPServerSpec | null => {
    const toolNodes = nodes.filter((n) => n.type === "tool");
    const outputNode = nodes.find((n) => n.type === "output");

    if (toolNodes.length === 0 || !outputNode) return null;

    // Find all workflows (paths from tool nodes to output)
    const workflows: Array<{
      name: string;
      steps: Array<{ id: string; tool: { workload: string; name: string } }>;
    }> = [];

    // Simple approach: each tool node connected to output = one workflow
    // In future, we could detect multi-step workflows
    toolNodes.forEach((toolNode) => {
      const hasConnectionToOutput = edges.some(
        (e) => e.source === toolNode.id && e.target === "output",
      );

      if (hasConnectionToOutput) {
        const toolData = toolNode.data as ToolNodeData;
        const workflowName = `${toolData.serverName}-${toolData.tool.name}`.replace(
          /-/g,
          "_",
        );

        workflows.push({
          name: workflowName,
          steps: [
            {
              id: "step1",
              tool: {
                workload: toolData.serverName,
                name: toolData.tool.name,
              },
            },
          ],
        });
      }
    });

    // For now, create a single composite tool from the first workflow
    // TODO: Support multiple workflows
    if (workflows.length === 0) return null;

    const outputData = outputNode.data as OutputNodeData;

    return {
      name: outputData?.name?.toLowerCase().replace(/\s+/g, "-") ?? "my-vmcp",
      description: outputData?.description,
      groupName: "default-group",
      incomingAuth: { type: "anonymous" },
      aggregation: {
        conflictResolution: "prefix",
        tools: [], // Empty for workflow-only vMCP
      },
      compositeTools: workflows.map((w) => ({
        name: w.name,
        description: `Workflow: ${w.name}`,
        steps: w.steps.map((s) => ({
          id: s.id,
          type: "tool" as const,
          tool: s.tool.name,
          arguments: {},
        })),
      })),
    };
  }, [nodes, edges]);

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
    tools: []
  compositeTools:
${spec.compositeTools
  ?.map(
    (ct) => `    - name: ${ct.name}
      description: ${ct.description}
      steps:
${ct.steps
  .map(
    (s) => `        - id: ${s.id}
          type: ${s.type}
          tool: ${s.tool}`,
  )
  .join("\n")}`,
  )
  .join("\n") ?? "    []"}
  serviceType: ${spec.serviceType ?? "ClusterIP"}`;
    },
    [],
  );

  // Generate YAML preview when spec changes
  useEffect(() => {
    const spec = buildWorkflowSpec();
    if (!spec) {
      setYaml(null);
      return;
    }

    setYaml(generateYaml(spec));
  }, [buildWorkflowSpec, generateYaml]);

  // Handle new connections - allow tool-to-tool and tool-to-output
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      // Allow connections between any nodes (tool-to-tool, tool-to-output)
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges],
  );

  // Handle dropping a tool from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const toolData = event.dataTransfer.getData("application/json");
      if (!toolData) return;

      const { server, tool } = JSON.parse(toolData) as {
        server: MCPServerWithTools;
        tool: MCPTool;
      };

      // Check if tool already exists
      const exists = nodes.some(
        (n) =>
          n.type === "tool" &&
          (n.data as ToolNodeData).serverName === server.name &&
          (n.data as ToolNodeData).tool.name === tool.name,
      );

      if (exists) {
        toast.error(`${tool.name} is already on the canvas`);
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `tool-${server.name}-${tool.name}-${Date.now()}`,
        type: "tool",
        position,
        data: {
          serverName: server.name,
          tool,
        } satisfies ToolNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
      toast.success(`Added ${tool.name}`);
    },
    [nodes, setNodes, screenToFlowPosition],
  );

  // Handle drag start from palette
  const onPaletteDragStart = useCallback(
    (
      event: React.DragEvent,
      server: MCPServerWithTools,
      tool: MCPTool,
    ) => {
      event.dataTransfer.setData(
        "application/json",
        JSON.stringify({ server, tool }),
      );
      event.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  // Handle deploy
  const handleDeploy = useCallback(async () => {
    const spec = buildWorkflowSpec();
    if (!spec) {
      toast.error("No workflow created");
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
        description: "Workflow deployment in progress...",
      });
    } catch {
      toast.error("Failed to deploy vMCP");
    } finally {
      setIsDeploying(false);
    }
  }, [buildWorkflowSpec]);

  const spec = buildWorkflowSpec();

  // Create node types with servers prop
  const nodeTypes = {
    tool: (props: NodeProps<Node<ToolNodeData, "tool">>) => (
      <ToolNode {...props} servers={servers} />
    ),
    output: OutputNode,
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar - Tool palette */}
      <div className="w-64 shrink-0">
        <ToolPalette servers={servers} onDragStart={onPaletteDragStart} />
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

interface WorkflowEditorProps {
  servers: MCPServerWithTools[];
}

/**
 * Main Workflow Editor component.
 * Wrapped in ReactFlowProvider for hook access.
 */
export function WorkflowEditor({ servers }: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner servers={servers} />
    </ReactFlowProvider>
  );
}

