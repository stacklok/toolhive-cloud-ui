import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export type McpClient = Awaited<ReturnType<typeof createMCPClient>>;

export interface McpRemote {
  url?: string;
  type?: string;
}

/**
 * Creates the appropriate transport for an MCP server based on its type.
 */
export function createMcpTransport(
  remoteUrl: string,
  remoteType?: string,
): SSEClientTransport | StreamableHTTPClientTransport {
  const url = new URL(remoteUrl);

  return remoteType === "sse"
    ? new SSEClientTransport(url)
    : new StreamableHTTPClientTransport(url);
}

/**
 * Creates an MCP client connection to a server.
 * Returns the client and its tools.
 *
 * Note: The caller is responsible for client lifecycle.
 * Don't call client.close() as it logs AbortError internally.
 */
export async function createMcpConnection(
  serverName: string,
  remote: McpRemote,
): Promise<{ client: McpClient; tools: Record<string, unknown> }> {
  if (!remote.url) {
    throw new Error(`Missing URL for server ${serverName}`);
  }

  const transport = createMcpTransport(remote.url, remote.type);

  const client = await createMCPClient({
    name: serverName,
    transport,
  });

  const tools = await client.tools();

  return { client, tools };
}
