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
import { getServers } from "@/app/catalog/actions";
import { SYSTEM_PROMPT } from "./system-prompt";

export const maxDuration = 60;

const MODEL = "anthropic/claude-sonnet-4.5";

interface ConnectionResult {
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
      data: { client, tools },
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

async function getMcpTools(): Promise<{
  tools: ToolSet;
  clients: Awaited<ReturnType<typeof createMCPClient>>[];
  errors: ConnectionError[];
}> {
  const allTools: ToolSet = {};
  const allClients: Awaited<ReturnType<typeof createMCPClient>>[] = [];
  const connectionErrors: ConnectionError[] = [];

  try {
    const servers = await getServers();

    // Flatten servers and remotes into a single array of connection tasks
    const remoteConnections = servers.flatMap((server) =>
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
        Object.assign(allTools, result.data.tools);
      } else {
        connectionErrors.push(result.error);
      }
    }

    console.log("Connected tools:", allTools);
  } catch (error) {
    console.error("Failed to fetch servers:", error);
  }

  return { tools: allTools, clients: allClients, errors: connectionErrors };
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response("OPENROUTER_API_KEY not configured", {
      status: 500,
    });
  }

  const { tools, clients, errors } = await getMcpTools();

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
  const model = provider(MODEL);

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
          model: MODEL,
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
