import { jsonSchema } from "ai";
import type { VMCPBuilderArtifact } from "../types";

/**
 * Parameters schema for the vmcp_builder tool
 */
const vmcpBuilderParametersSchema = jsonSchema<{
  name: string;
  description?: string;
  servers: Array<{
    name: string;
    tools: string[];
  }>;
}>({
  type: "object",
  properties: {
    name: {
      type: "string",
      description: "Name for the vMCP (e.g., 'github-sentry-workflow')",
    },
    description: {
      type: "string",
      description: "Description of what this vMCP does",
    },
    servers: {
      type: "array",
      description: "List of MCP servers with their selected tools",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "Server name (e.g., 'github-mcp', 'slack-mcp', 'jira-mcp', 'postgres-mcp', 'filesystem-mcp')",
          },
          tools: {
            type: "array",
            items: { type: "string" },
            description: "List of tool names to include from this server",
          },
        },
        required: ["name", "tools"],
      },
    },
  },
  required: ["name", "servers"],
});

/**
 * Parameters schema for modifying the builder
 */
const vmcpBuilderModifySchema = jsonSchema<{
  action:
    | "add_server"
    | "remove_server"
    | "select_tools"
    | "deselect_tools"
    | "set_name"
    | "set_description"
    | "add_workflow_step"
    | "switch_tab"
    | "get_state";
  serverName?: string;
  tools?: string[];
  name?: string;
  description?: string;
  toolName?: string;
  tab?: "aggregation" | "workflows" | "yaml";
}>({
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: [
        "add_server",
        "remove_server",
        "select_tools",
        "deselect_tools",
        "set_name",
        "set_description",
        "add_workflow_step",
        "switch_tab",
        "get_state",
      ],
      description: "The action to perform on the vMCP builder",
    },
    serverName: {
      type: "string",
      description:
        "Name of the MCP server (for add_server, remove_server, select_tools, deselect_tools, add_workflow_step)",
    },
    tools: {
      type: "array",
      items: { type: "string" },
      description: "List of tool names to select or deselect",
    },
    name: {
      type: "string",
      description: "New name for the vMCP (for set_name)",
    },
    description: {
      type: "string",
      description: "New description for the vMCP (for set_description)",
    },
    toolName: {
      type: "string",
      description: "Name of the tool (for add_workflow_step)",
    },
    tab: {
      type: "string",
      enum: ["aggregation", "workflows", "yaml"],
      description: "Tab to switch to (for switch_tab)",
    },
  },
  required: ["action"],
});

/**
 * Tool definition for triggering the vMCP Builder artifact.
 * When the user asks to create a Virtual MCP Server, the AI can use this tool
 * to render an interactive builder interface.
 */
export const vmcpBuilderTool = {
  description: `Creates a Virtual MCP Server (vMCP) and displays it as an interactive React Flow diagram.

REQUIRED PARAMETERS:
- name: A descriptive name for the vMCP (e.g., "github-sentry-integration")
- servers: Array of MCP servers with their tools to include

AVAILABLE SERVERS (use these exact names):
- github-mcp: GitHub operations (create_issue, get_repository, list_pull_requests, merge_pull_request, create_branch)
- slack-mcp: Slack messaging (send_message, create_channel, list_channels, send_direct_message)
- jira-mcp: Jira project management (create_issue, update_issue, get_issue, transition_issue, add_comment)
- postgres-mcp: PostgreSQL database (execute_query, list_tables, describe_table)
- filesystem-mcp: File operations (read_file, write_file, list_directory, create_directory)

EXAMPLE: User says "create a vMCP that creates GitHub issues and sends Slack notifications"
Call with:
{
  "name": "github-slack-notifier",
  "description": "Creates GitHub issues and notifies Slack",
  "servers": [
    { "name": "github-mcp", "tools": ["create_issue"] },
    { "name": "slack-mcp", "tools": ["send_message"] }
  ]
}

The result is an interactive React Flow canvas showing the configured workflow.`,

  inputSchema: vmcpBuilderParametersSchema,

  execute: async ({
    name,
    description,
    servers,
  }: {
    name: string;
    description?: string;
    servers: Array<{ name: string; tools: string[] }>;
  }) => {
    const artifact: VMCPBuilderArtifact = {
      id: `vmcp-builder-${Date.now()}`,
      type: "vmcp-builder",
      title: name,
      description: description ?? "Virtual MCP Server configuration",
      createdAt: Date.now(),
      data: {
        mode: "create",
        initialConfig: {
          name,
          description,
          groupName: "default-group",
          aggregation: {
            conflictResolution: "prefix",
            tools: servers.map((s) => ({
              workload: s.name,
              filter: s.tools,
            })),
          },
        },
        // Pass the servers configuration to initialize the React Flow canvas
        initialServers: servers,
      },
    };

    return {
      artifact,
      message: `Created vMCP "${name}" with ${servers.length} server(s). The interactive builder is now displayed above.`,
    };
  },
};

/**
 * Tool for modifying an active vMCP builder
 */
export const vmcpBuilderModifyTool = {
  description: `Modifies an EXISTING vMCP Builder. Only use AFTER vmcp_builder has been called.

ACTIONS:
- add_server: Add a new MCP server. Requires: serverName, tools (array of tool names)
- remove_server: Remove a server. Requires: serverName
- select_tools: Enable additional tools. Requires: serverName, tools
- deselect_tools: Disable tools. Requires: serverName, tools
- set_name: Change vMCP name. Requires: name
- set_description: Change description. Requires: description
- switch_tab: Switch view. Requires: tab (aggregation/workflows/yaml)

EXAMPLE - Add Jira server:
{ "action": "add_server", "serverName": "jira-mcp", "tools": ["create_issue", "update_issue"] }

EXAMPLE - Remove tool from server:
{ "action": "deselect_tools", "serverName": "github-mcp", "tools": ["create_issue"] }

The React Flow diagram will update automatically.`,

  inputSchema: vmcpBuilderModifySchema,

  execute: async ({
    action,
    serverName,
    tools,
    name,
    description,
    toolName,
    tab,
  }: {
    action: string;
    serverName?: string;
    tools?: string[];
    name?: string;
    description?: string;
    toolName?: string;
    tab?: "aggregation" | "workflows" | "yaml";
  }) => {
    // This tool works with the client-side context
    // The actual modification happens via a global event/registry
    const command = {
      action,
      serverName,
      tools,
      name,
      description,
      toolName,
      tab,
      timestamp: Date.now(),
    };

    return {
      command,
      message: getActionMessage(action, {
        serverName,
        tools,
        name,
        description,
        toolName,
        tab,
      }),
    };
  },
};

function getActionMessage(
  action: string,
  params: {
    serverName?: string;
    tools?: string[];
    name?: string;
    description?: string;
    toolName?: string;
    tab?: string;
  }
): string {
  switch (action) {
    case "add_server":
      return `Adding ${params.serverName} to the builder.`;
    case "remove_server":
      return `Removing ${params.serverName} from the builder.`;
    case "select_tools":
      return `Selecting tools [${params.tools?.join(", ")}] for ${
        params.serverName
      }.`;
    case "deselect_tools":
      return `Deselecting tools [${params.tools?.join(", ")}] for ${
        params.serverName
      }.`;
    case "set_name":
      return `Setting vMCP name to "${params.name}".`;
    case "set_description":
      return `Setting vMCP description to "${params.description}".`;
    case "add_workflow_step":
      return `Adding ${params.toolName} from ${params.serverName} to the workflow.`;
    case "switch_tab":
      return `Switching to the ${params.tab} tab.`;
    case "get_state":
      return "Retrieving current builder state.";
    default:
      return `Performing action: ${action}`;
  }
}

/**
 * Get all artifact-related tools
 */
export function getArtifactTools() {
  return {
    vmcp_builder: vmcpBuilderTool,
    vmcp_builder_modify: vmcpBuilderModifyTool,
  };
}
