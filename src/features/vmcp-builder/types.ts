/**
 * Types for Virtual MCP Server configuration.
 * Based on the VirtualMCPServer CRD from toolhive Kubernetes Operator.
 */

/** Tool definition from an MCP server */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

/** Lucide icon names for known services */
export type ServiceIconName =
  | "github"
  | "slack"
  | "ticket"
  | "database"
  | "folder"
  | "server"
  | "code"
  | "globe";

/** MCP Server with its available tools */
export interface MCPServerWithTools {
  name: string;
  title: string;
  description: string;
  version: string;
  tools: MCPTool[];
  iconUrl?: string;
  iconName?: ServiceIconName;
}

/** Tool override configuration */
export interface ToolOverride {
  name?: string;
  description?: string;
}

/** Per-workload tool configuration */
export interface WorkloadToolConfig {
  workload: string;
  filter: string[];
  overrides?: Record<string, ToolOverride>;
}

/** Conflict resolution strategy */
export type ConflictResolution = "prefix" | "priority" | "manual";

/** Aggregation configuration */
export interface AggregationConfig {
  conflictResolution: ConflictResolution;
  prefixFormat?: string;
  priorityOrder?: string[];
  tools: WorkloadToolConfig[];
}

/** Workflow step definition */
export interface WorkflowStep {
  id: string;
  type: "tool" | "elicitation";
  tool?: string;
  arguments?: Record<string, unknown>;
  message?: string;
  dependsOn?: string[];
  condition?: string;
  timeout?: string;
}

/** Composite tool (workflow) definition */
export interface CompositeToolSpec {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
  steps: WorkflowStep[];
  timeout?: string;
}

/** Authentication configuration */
export interface AuthConfig {
  type: "anonymous" | "oidc";
}

/** Virtual MCP Server specification */
export interface VirtualMCPServerSpec {
  name: string;
  description?: string;
  groupName: string;
  incomingAuth: AuthConfig;
  aggregation: AggregationConfig;
  compositeTools?: CompositeToolSpec[];
  serviceType?: "ClusterIP" | "NodePort" | "LoadBalancer";
}

/** Virtual MCP Server status */
export interface VirtualMCPServerStatus {
  phase: "Pending" | "Ready" | "Degraded" | "Failed";
  message?: string;
  url?: string;
  backendCount: number;
}

/** Complete Virtual MCP Server resource */
export interface VirtualMCPServer {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  spec: VirtualMCPServerSpec;
  status: VirtualMCPServerStatus;
}

// ============================================
// React Flow Node Types
// ============================================

/** Callback for toggling tool selection */
export type ToolToggleCallback = (nodeId: string, toolName: string) => void;

/** Node data for MCP Server nodes in the flow */
export interface MCPServerNodeData extends Record<string, unknown> {
  server: MCPServerWithTools;
  selectedTools: string[];
  onToolToggle?: ToolToggleCallback;
  nodeId?: string;
}

/** Node data for Tool nodes in the flow */
export interface ToolNodeData extends Record<string, unknown> {
  serverName: string;
  tool: MCPTool;
  override?: ToolOverride;
}

/** Node data for Output node */
export interface OutputNodeData extends Record<string, unknown> {
  name: string;
  description: string;
}

/** Union type for all node data */
export type VMCPNodeData = MCPServerNodeData | ToolNodeData | OutputNodeData;

// ============================================
// API Request/Response Types
// ============================================

/** Request to create a vMCP */
export interface CreateVMCPRequest {
  spec: VirtualMCPServerSpec;
}

/** Response from listing vMCPs */
export interface ListVMCPResponse {
  vmcps: VirtualMCPServer[];
  total: number;
}

/** Request to list available MCP servers with tools */
export interface ListMCPServersWithToolsResponse {
  servers: MCPServerWithTools[];
}
