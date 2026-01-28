import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type ToolSet,
} from "ai";
import { ollama } from "ai-sdk-ollama";
import { headers } from "next/headers";
import { getServers } from "@/app/catalog/actions";
import { DEFAULT_MODEL } from "@/features/assistant";
import { auth } from "@/lib/auth/auth";
import {
  createMcpConnection,
  type McpClient,
  type McpRemote,
} from "@/lib/mcp/client";
import { SYSTEM_PROMPT } from "./system-prompt";

const E2E_MODEL_NAME = process.env.E2E_MODEL_NAME ?? "qwen2.5:1.5b";

export const maxDuration = 60;

interface ConnectionResult {
  serverName: string;
  client: McpClient;
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
  remote: McpRemote,
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
    const { client, tools: serverTools } = await createMcpConnection(
      serverName,
      remote,
    );

    const tools: ToolSet = {};
    for (const [toolName, toolDef] of Object.entries(serverTools)) {
      tools[toolName] = toolDef as ToolSet[string];
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
  clients: McpClient[];
  errors: ConnectionError[];
  /** Map of server name -> available tool names (for UI) */
  availableTools: Record<string, { name: string; description?: string }[]>;
}

async function getMcpTools(
  options: McpToolsRequest = {},
): Promise<McpToolsResult> {
  const allTools: ToolSet = {};
  const allClients: McpClient[] = [];
  const connectionErrors: ConnectionError[] = [];
  const availableTools: Record<
    string,
    { name: string; description?: string }[]
  > = {};

  // If no servers are explicitly selected, skip MCP connections entirely
  // This allows users to chat without tools when they haven't selected any servers
  if (!options.selectedServers || options.selectedServers.length === 0) {
    return {
      tools: allTools,
      clients: allClients,
      errors: connectionErrors,
      availableTools,
    };
  }

  try {
    const servers = await getServers();

    // Filter servers to only those explicitly selected by the user
    const serversToConnect = servers.filter(
      (s) => s.name && options.selectedServers?.includes(s.name),
    );

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
  // Verify user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

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

  // Check if we should use a testing model (for E2E testing)
  const useTestingModel = process.env.USE_E2E_MODEL === "true";

  // Validate API key for production mode
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!useTestingModel && !apiKey) {
    console.error("[Chat API] OPENROUTER_API_KEY not configured");
    return new Response("Service unavailable", { status: 503 });
  }

  // Create model - use testing model for E2E tests, OpenRouter for production
  const model = useTestingModel
    ? ollama(E2E_MODEL_NAME)
    : createOpenRouter({ apiKey: apiKey as string })(modelId);

  if (useTestingModel) {
    console.log(`[Chat API] Using E2E testing model: ${E2E_MODEL_NAME}`);
  }

  // Skip MCP tool fetching in E2E test mode to avoid connection errors
  const { tools, clients, errors } = useTestingModel
    ? { tools: {}, clients: [], errors: [] }
    : await getMcpTools({
        selectedServers,
        enabledTools: enabledToolsFromRequest,
      });

  // If all servers failed to connect, return an error (skip in E2E test mode)
  if (
    !useTestingModel &&
    Object.keys(tools).length === 0 &&
    errors.length > 0
  ) {
    const serverNames = errors.map((err) => err.serverName).join(", ");
    return new Response(
      `Unable to connect to ${serverNames} MCP servers. Please check that the servers are running and accessible.`,
      {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      },
    );
  }

  const startTime = Date.now();
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model,
    messages: modelMessages,
    tools,
    toolChoice: "auto",
    stopWhen: stepCountIs(5), // Allow multiple steps for tool execution and response generation
    system: SYSTEM_PROMPT,
    // Use low temperature for more deterministic responses in E2E test mode
    temperature: useTestingModel ? 0 : undefined,
    onFinish: async () => {
      // Close MCP clients
      for (const client of clients) {
        try {
          await client.close();
        } catch (error) {
          console.error("[Chat API] Failed to close MCP client:", error);
        }
      }
    },
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) => {
      if (part.type === "start") {
        return {
          createdAt: Date.now(),
          model: useTestingModel ? E2E_MODEL_NAME : modelId,
          providerId: useTestingModel ? "e2e-testing" : "openrouter",
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
