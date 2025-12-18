"use server";

import { getServers } from "@/app/catalog/actions";
import { createMcpConnection } from "@/lib/mcp/client";

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

    const remote = remotes[0];
    if (!remote?.url) {
      return {
        serverName,
        tools: [],
        isRunning: false,
        error: "No URL configured",
      };
    }

    const { tools: serverTools } = await createMcpConnection(
      serverName,
      remote,
    );

    const tools: McpToolInfo[] = Object.entries(serverTools).map(
      ([name, def]) => ({
        name,
        description: (def as { description?: string }).description,
        enabled: true,
      }),
    );

    return {
      serverName,
      tools,
      isRunning: true,
    };
  } catch (error) {
    // Silently handle AbortError - happens when component re-renders during fetch
    if (error instanceof Error && error.name === "AbortError") {
      return {
        serverName,
        tools: [],
        isRunning: false,
      };
    }

    console.error(`Failed to fetch tools for ${serverName}:`, error);
    return {
      serverName,
      tools: [],
      isRunning: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
