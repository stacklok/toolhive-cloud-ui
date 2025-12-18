import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type ToolSet,
} from "ai";
import { DEFAULT_MODEL } from "@/app/assistant/constants";
import { getServers } from "@/app/catalog/actions";
import { SYSTEM_PROMPT } from "./system-prompt";

export const maxDuration = 60;

interface ConnectionResult {
  serverName: string;
  client: Awaited<ReturnType<typeof createMCPClient>>;
  tools: ToolSet;
}

interface ConnectionError {
  serverName: string;
  url: string;
  error: string;
}

/**
 * Connects to a single MCP server remote and collects its tools.
 * Returns the connection result or an error object.
 */
async function connectToMcpRemote(
  serverName: string,
  remote: { url?: string; type?: string },
): Promise<
  | { success: true; data: ConnectionResult }
  | { success: false; error: ConnectionError }
> {
  if (!remote.url) {
    return {
      success: false,
      error: {
        serverName,
        url: "N/A",
        error: "Missing URL",
      },
    };
  }

  try {
    // const url = new URL(remote.url);
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

    const serverTools = await client.tools();
    const tools: ToolSet = {};

    for (const [toolName, toolDef] of Object.entries(serverTools)) {
      tools[toolName] = toolDef;
    }

    return {
      success: true,
      data: { serverName, client, tools },
    };
  } catch (error) {
    console.error(
      `Failed to connect to MCP server ${serverName} at ${remote.url}:`,
      error,
    );

    return {
      success: false,
      error: {
        serverName,
        url: remote.url,
        error: "Connection failed",
      },
    };
  }
}

interface McpToolsRequest {
  /** Server names to connect to. If empty, connects to all servers. */
  selectedServers?: string[];
  /** Map of server name -> enabled tool names. If not provided, all tools are enabled. */
  enabledTools?: Record<string, string[]>;
}

interface McpToolsResult {
  tools: ToolSet;
  clients: Awaited<ReturnType<typeof createMCPClient>>[];
  errors: ConnectionError[];
  /** Map of server name -> available tool names (for UI) */
  availableTools: Record<string, { name: string; description?: string }[]>;
}

async function getMcpTools(
  options: McpToolsRequest = {},
): Promise<McpToolsResult> {
  const allTools: ToolSet = {};
  const allClients: Awaited<ReturnType<typeof createMCPClient>>[] = [];
  const connectionErrors: ConnectionError[] = [];
  const availableTools: Record<
    string,
    { name: string; description?: string }[]
  > = {};

  try {
    const servers = await getServers();

    // Filter servers if selectedServers is provided
    const serversToConnect =
      options.selectedServers && options.selectedServers.length > 0
        ? servers.filter(
            (s) => s.name && options.selectedServers?.includes(s.name),
          )
        : servers;

    // Flatten servers and remotes into a single array of connection tasks
    const remoteConnections = serversToConnect.flatMap((server) =>
      (server.remotes ?? []).map((remote) =>
        connectToMcpRemote(server.name ?? "unknown", remote),
      ),
    );

    // Connect to all remotes in parallel
    const results = await Promise.all(remoteConnections);

    // Collect successful connections and errors
    for (const result of results) {
      if (result.success) {
        allClients.push(result.data.client);

        // Track available tools for this server
        const serverName = result.data.serverName;
        const serverToolsList: { name: string; description?: string }[] = [];

        for (const [toolName, toolDef] of Object.entries(result.data.tools)) {
          serverToolsList.push({
            name: toolName,
            description: toolDef.description,
          });

          // Check if this tool is enabled
          const serverEnabledTools = options.enabledTools?.[serverName];
          const isToolEnabled =
            !serverEnabledTools || serverEnabledTools.includes(toolName);

          if (isToolEnabled) {
            allTools[toolName] = toolDef;
          }
        }

        availableTools[serverName] = serverToolsList;
      } else {
        connectionErrors.push(result.error);
      }
    }
  } catch (error) {
    console.error("Failed to fetch servers:", error);
  }

  return {
    tools: allTools,
    clients: allClients,
    errors: connectionErrors,
    availableTools,
  };
}

export async function POST(req: Request) {
  const {
    messages,
    model: requestedModel,
    selectedServers,
    enabledTools: enabledToolsFromRequest,
  } = await req.json();

  // Use the model from the request body, or fall back to the default
  const modelId =
    typeof requestedModel === "string" && requestedModel.trim()
      ? requestedModel
      : DEFAULT_MODEL;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response("OPENROUTER_API_KEY not configured", {
      status: 500,
    });
  }

  const { tools, clients, errors } = await getMcpTools({
    selectedServers,
    enabledTools: enabledToolsFromRequest,
  });

  // If all servers failed to connect, return an error
  if (Object.keys(tools).length === 0 && errors.length > 0) {
    const serverNames = errors.map((err) => err.serverName).join(", ");
    return new Response(
      `Unable to connect to ${serverNames} MCP servers. Please check that the servers are running and accessible.`,
      {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      },
    );
  }

  const provider = createOpenRouter({ apiKey });
  const model = provider(modelId);

  const startTime = Date.now();

  const result = streamText({
    model,
    messages: convertToModelMessages(messages),
    tools,
    toolChoice: "auto",
    stopWhen: stepCountIs(5), // Allow multiple steps for tool execution and response generation
    system: SYSTEM_PROMPT,
    onFinish: async () => {
      // Close MCP clients
      for (const client of clients) {
        try {
          await client.close();
        } catch {}
      }
    },
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) => {
      if (part.type === "start") {
        return {
          createdAt: Date.now(),
          model: modelId,
          providerId: "openrouter",
        };
      }
      if (part.type === "finish") {
        const endTime = Date.now();
        return {
          totalUsage: part.totalUsage,
          responseTime: endTime - startTime,
          finishReason: part.finishReason,
        };
      }
      return undefined;
    },
  });
}
