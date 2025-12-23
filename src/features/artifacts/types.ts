/**
 * Artifact Types for the Chat Assistant
 *
 * Artifacts are interactive UI components that can be rendered inline
 * in chat messages. They are triggered by tool calls from the AI.
 */

/**
 * Base artifact interface
 */
export interface BaseArtifact {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: number;
}

/**
 * Initial server configuration for the vMCP builder
 */
export interface InitialServerConfig {
  name: string;
  tools: string[];
}

/**
 * vMCP Builder artifact - renders a React Flow editor for building
 * Virtual MCP Servers
 */
export interface VMCPBuilderArtifact extends BaseArtifact {
  type: "vmcp-builder";
  data: {
    /** Initial configuration, if editing an existing vMCP */
    initialConfig?: VMCPConfig;
    /** Available MCP servers to choose from */
    availableServers?: string[];
    /** Mode: 'create' or 'edit' */
    mode: "create" | "edit";
    /** Initial servers with selected tools to pre-populate the canvas */
    initialServers?: InitialServerConfig[];
  };
}

/**
 * Code artifact - renders syntax-highlighted code with copy functionality
 */
export interface CodeArtifact extends BaseArtifact {
  type: "code";
  data: {
    code: string;
    language: string;
    filename?: string;
  };
}

/**
 * YAML Preview artifact - renders YAML with syntax highlighting
 */
export interface YAMLPreviewArtifact extends BaseArtifact {
  type: "yaml-preview";
  data: {
    yaml: string;
    title?: string;
  };
}

/**
 * vMCP Configuration structure
 */
export interface VMCPConfig {
  name: string;
  description?: string;
  groupName: string;
  aggregation: {
    conflictResolution: "prefix" | "first" | "error";
    tools: Array<{
      workload: string;
      filter: string[];
    }>;
  };
  compositeTools?: Array<{
    name: string;
    description: string;
    steps: Array<{
      id: string;
      type: "tool" | "elicitation";
      tool?: { workload: string; name: string };
      message?: string;
    }>;
  }>;
}

/**
 * Union type for all artifact types
 */
export type Artifact = VMCPBuilderArtifact | CodeArtifact | YAMLPreviewArtifact;

/**
 * Artifact tool call result - returned from the AI when it wants to render an artifact
 */
export interface ArtifactToolCallResult {
  type: "artifact";
  artifact: Artifact;
}

/**
 * Check if a value is an artifact
 */
export function isArtifact(value: unknown): value is Artifact {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "type" in value &&
    "title" in value &&
    typeof (value as Artifact).type === "string" &&
    ["vmcp-builder", "code", "yaml-preview"].includes((value as Artifact).type)
  );
}

/**
 * Check if a value is a vMCP builder artifact
 */
export function isVMCPBuilderArtifact(
  value: unknown
): value is VMCPBuilderArtifact {
  return isArtifact(value) && value.type === "vmcp-builder";
}
