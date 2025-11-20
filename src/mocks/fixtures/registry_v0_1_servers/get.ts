export default {
  servers: [
    {
      server: {
        name: "awslabs/aws-nova-canvas",
        description: "Image generation using Amazon Nova Canvas",
        repository: { id: "awslabs", source: "github" },
        remotes: [],
      },
    },
    {
      server: {
        name: "tinyfish/agentql-mcp",
        description: "A powerful MCP server for building AI agents",
        repository: { id: "tinyfish", source: "github" },
        remotes: [],
      },
    },
    {
      server: {
        name: "datastax/astra-db-mcp",
        description: "Integrate AI assistants with Astra DB",
        repository: { id: "datastax", source: "github" },
        remotes: [],
      },
    },
    {
      server: {
        name: "microsoft/azure-mcp",
        description: "Connect AI assistants to Azure services",
        repository: { id: "microsoft", source: "github" },
        remotes: [],
      },
    },
    {
      server: {
        name: "google/mcp-google-apps",
        description: "Virtual MCP for Google Workspace apps",
        repository: { id: "google", source: "github" },
        remotes: [{ type: "http", url: "https://example.com/google" }],
      },
    },
    {
      server: {
        name: "figma/mcp-desktop",
        description: "Virtual MCP for Figma Desktop application",
        repository: { id: "figma", source: "github" },
        remotes: [{ type: "http", url: "https://example.com/figma" }],
      },
    },
    {
      server: {
        name: "slack/mcp-slack",
        description: "Virtual MCP for Slack workspaces",
        repository: { id: "slack", source: "github" },
        remotes: [{ type: "http", url: "https://example.com/slack" }],
      },
    },
    {
      server: {
        name: "atlassian/mcp-jira",
        description: "Virtual MCP for managing Jira issues",
        repository: { id: "atlassian", source: "github" },
        remotes: [{ type: "http", url: "https://example.com/jira" }],
      },
    },
  ],
  metadata: {
    count: 8,
    nextCursor: "next-page",
  },
};
