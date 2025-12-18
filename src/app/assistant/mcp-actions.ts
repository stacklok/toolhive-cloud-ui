"use server";

import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { getServers } from "@/app/catalog/actions";

export interface McpToolInfo {
  name: string;
  description?: string;
  enabled: boolean;
}

export interface McpServerToolsResponse {
  serverName: string;
  tools: McpToolInfo[];
  isRunning: boolean;
  error?: string;
}

/**
 * Fetches tools for a specific MCP server by connecting to it.
 */
export async function getMcpServerTools(
  serverName: string,
): Promise<McpServerToolsResponse> {
  try {
    const servers = await getServers();
    const server = servers.find((s) => s.name === serverName);

    if (!server) {
      return {
        serverName,
        tools: [],
        isRunning: false,
        error: "Server not found",
      };
    }

    const remotes = server.remotes ?? [];
    if (remotes.length === 0) {
      return {
        serverName,
        tools: [],
        isRunning: false,
        error: "No remote endpoints configured",
      };
    }

    // Try to connect to the first remote
    const remote = remotes[0];
    if (!remote?.url) {
      return {
        serverName,
        tools: [],
        isRunning: false,
        error: "No URL configured",
      };
    }

    // MOCK LOCAL MCP SERVER cause the remote one is not working
    const url = new URL("http://127.0.0.1:13942/mcp");
    const transport =
      remote.type === "sse"
        ? new SSEClientTransport(url)
        : new StreamableHTTPClientTransport(url);

    const client = await createMCPClient({
      name: serverName,
      transport,
    });

    try {
      const serverTools = await client.tools();

      const tools: McpToolInfo[] = Object.entries(serverTools).map(
        ([name, def]) => ({
          name,
          description: def.description,
          enabled: true, // All enabled by default
        }),
      );

      return {
        serverName,
        tools,
        isRunning: true,
      };
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error(`Failed to fetch tools for ${serverName}:`, error);
    return {
      serverName,
      tools: [],
      isRunning: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
