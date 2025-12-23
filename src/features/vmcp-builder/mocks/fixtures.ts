/**
 * Mock fixtures for vMCP Builder POC.
 * These simulate the API responses for MCP servers with tools.
 */

import type {
  MCPServerWithTools,
  VirtualMCPServer,
} from "@/features/vmcp-builder/types";

/** Mock MCP servers with their tools - simulates deployed MCP servers */
export const mockMCPServersWithTools: MCPServerWithTools[] = [
  {
    name: "github-mcp",
    title: "GitHub MCP Server",
    description: "MCP server for GitHub operations",
    version: "1.2.0",
    iconName: "github", // Use Lucide icon name
    tools: [
      {
        name: "search_issues",
        description: "Search for issues in a GitHub repository",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            repo: { type: "string", description: "Repository name" },
          },
          required: ["query"],
        },
      },
      {
        name: "create_issue",
        description: "Create a new issue in a repository",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            body: { type: "string" },
            labels: { type: "array", items: { type: "string" } },
          },
          required: ["title"],
        },
      },
      {
        name: "create_pull_request",
        description: "Create a pull request",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            head: { type: "string" },
            base: { type: "string" },
          },
          required: ["title", "head", "base"],
        },
      },
      {
        name: "get_file_contents",
        description: "Get contents of a file from a repository",
        inputSchema: {
          type: "object",
          properties: {
            repo: { type: "string" },
            path: { type: "string" },
          },
          required: ["repo", "path"],
        },
      },
      {
        name: "list_commits",
        description: "List commits in a repository",
        inputSchema: {
          type: "object",
          properties: {
            repo: { type: "string" },
            branch: { type: "string" },
          },
          required: ["repo"],
        },
      },
    ],
  },
  {
    name: "slack-mcp",
    title: "Slack MCP Server",
    description: "MCP server for Slack messaging",
    version: "2.0.1",
    iconName: "slack", // Use Lucide icon name
    tools: [
      {
        name: "send_message",
        description: "Send a message to a Slack channel",
        inputSchema: {
          type: "object",
          properties: {
            channel: { type: "string" },
            text: { type: "string" },
          },
          required: ["channel", "text"],
        },
      },
      {
        name: "list_channels",
        description: "List all available Slack channels",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number" },
          },
        },
      },
      {
        name: "search_messages",
        description: "Search for messages in Slack",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
          },
          required: ["query"],
        },
      },
    ],
  },
  {
    name: "jira-mcp",
    title: "Jira MCP Server",
    description: "MCP server for Jira project management",
    version: "1.5.0",
    iconName: "ticket", // Use Lucide icon name (Jira = ticket/issue tracker)
    tools: [
      {
        name: "create_issue",
        description: "Create a new Jira issue",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string" },
            summary: { type: "string" },
            description: { type: "string" },
            issueType: { type: "string" },
          },
          required: ["project", "summary", "issueType"],
        },
      },
      {
        name: "search_issues",
        description: "Search Jira issues with JQL",
        inputSchema: {
          type: "object",
          properties: {
            jql: { type: "string" },
          },
          required: ["jql"],
        },
      },
      {
        name: "update_issue",
        description: "Update an existing Jira issue",
        inputSchema: {
          type: "object",
          properties: {
            issueKey: { type: "string" },
            fields: { type: "object" },
          },
          required: ["issueKey"],
        },
      },
      {
        name: "add_comment",
        description: "Add a comment to a Jira issue",
        inputSchema: {
          type: "object",
          properties: {
            issueKey: { type: "string" },
            body: { type: "string" },
          },
          required: ["issueKey", "body"],
        },
      },
    ],
  },
  {
    name: "postgres-mcp",
    title: "PostgreSQL MCP Server",
    description: "MCP server for PostgreSQL database operations",
    version: "1.0.0",
    iconName: "database", // Use Lucide icon name
    tools: [
      {
        name: "execute_query",
        description: "Execute a SQL query",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            params: { type: "array" },
          },
          required: ["query"],
        },
      },
      {
        name: "list_tables",
        description: "List all tables in the database",
        inputSchema: {
          type: "object",
          properties: {
            schema: { type: "string" },
          },
        },
      },
      {
        name: "describe_table",
        description: "Get the schema of a table",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string" },
          },
          required: ["table"],
        },
      },
    ],
  },
  {
    name: "filesystem-mcp",
    title: "Filesystem MCP Server",
    description: "MCP server for local filesystem operations",
    version: "1.1.0",
    iconName: "folder", // Use Lucide icon name
    tools: [
      {
        name: "read_file",
        description: "Read contents of a file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" },
          },
          required: ["path"],
        },
      },
      {
        name: "write_file",
        description: "Write contents to a file",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" },
            content: { type: "string" },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "list_directory",
        description: "List contents of a directory",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string" },
          },
          required: ["path"],
        },
      },
    ],
  },
];

/** Mock saved vMCP configurations */
export const mockSavedVMCPs: VirtualMCPServer[] = [
  {
    id: "vmcp-1",
    name: "dev-workflow",
    createdAt: "2024-12-20T10:00:00Z",
    updatedAt: "2024-12-20T10:00:00Z",
    spec: {
      name: "dev-workflow",
      description: "Development workflow combining GitHub and Slack",
      groupName: "dev-group",
      incomingAuth: { type: "anonymous" },
      aggregation: {
        conflictResolution: "prefix",
        tools: [
          {
            workload: "github-mcp",
            filter: ["search_issues", "create_pull_request"],
          },
          {
            workload: "slack-mcp",
            filter: ["send_message"],
          },
        ],
      },
    },
    status: {
      phase: "Ready",
      url: "https://vmcp.example.com/dev-workflow",
      backendCount: 2,
    },
  },
];
