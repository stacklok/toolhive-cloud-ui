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

export const maxDuration = 60;

const MODEL = "anthropic/claude-sonnet-4.5";

async function getMcpTools(): Promise<{
  tools: ToolSet;
  clients: Awaited<ReturnType<typeof createMCPClient>>[];
}> {
  const tools: ToolSet = {};
  const clients: Awaited<ReturnType<typeof createMCPClient>>[] = [];

  try {
    const servers = await getServers();

    for (const server of servers) {
      for (const remote of server.remotes ?? []) {
        if (!remote.url) continue;

        try {
          // const url = new URL(remote.url);
          const url = new URL("http://127.0.0.1:57834/mcp");
          const transport =
            remote.type === "sse"
              ? new SSEClientTransport(url)
              : new StreamableHTTPClientTransport(url);

          const client = await createMCPClient({
            name: server.name ?? "unknown",
            transport,
          });

          clients.push(client);

          const serverTools = await client.tools();
          for (const [toolName, toolDef] of Object.entries(serverTools)) {
            tools[toolName] = toolDef;
          }
          console.log(tools);
        } catch (error) {
          console.error(
            `Failed to connect to MCP server ${server.name} at ${remote.url}:`,
            error,
          );
        }
      }
    }
  } catch (error) {
    console.error("Failed to fetch servers:", error);
  }

  return { tools, clients };
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response("OPENROUTER_API_KEY not configured", {
      status: 500,
    });
  }

  const { tools, clients } = await getMcpTools();

  const provider = createOpenRouter({ apiKey });
  const model = provider(MODEL);

  const result = streamText({
    model,
    messages: convertToModelMessages(messages),
    tools,
    toolChoice: "auto",
    stopWhen: stepCountIs(5), // Allow multiple steps for tool execution and response generation
    system: `You are a helpful assistant with access to MCP (Model Context Protocol) servers from ToolHive.

    You have access to various specialized tools from enabled MCP servers. Each tool is prefixed with the server name (e.g., github-stats-mcp_get_repository_info).

    🚨 CRITICAL INSTRUCTION: After calling ANY tool, you MUST immediately follow up with a text response that processes and interprets the tool results. NEVER just call a tool and stop talking.

    MANDATORY WORKFLOW:
    1. Call the appropriate tool(s) to get data
    2. IMMEDIATELY after the tool returns data, write a comprehensive text response
    3. Parse and analyze the tool results in your text response
    4. Extract key information and insights
    5. Format everything in beautiful markdown
    6. Provide a complete answer to the user's question

    ⚠️ IMPORTANT: You must ALWAYS provide a text response after tool calls. Tool calls alone are not sufficient - users need you to interpret and explain the results.

    🔄 CONTINUATION RULE: Even if you've called tools, you MUST continue the conversation with a detailed analysis. Do not end your response after tool execution - always provide interpretation, insights, and a complete answer.

    FORMATTING REQUIREMENTS:
    - Always use **Markdown syntax** for all responses
    - Use proper headings (# ## ###), lists (- or 1.), tables, code blocks, etc.
    - Present tool results in well-structured, readable format
    - Extract meaningful insights from data
    - NEVER show raw JSON or unformatted technical data
    - NEVER just say "here's the result" - always interpret and format it

    🖼️ IMAGE HANDLING:
    - When a tool returns an image, the image will automatically display in the tool output section
    - NEVER include base64 image data in your text response
    - NEVER use <image> tags or data URIs in your text
    - DO NOT copy or paste image data from tool outputs into your response
    - Simply provide context and analysis about what the image shows
    - The tool output section will automatically render any images returned by tools
    - Focus your text response on interpreting and explaining the results
    - Example: "I've generated a bar chart showing the sales data. The chart displays the relationship between products and their sales figures, with smartphones having the highest sales."

    MARKDOWN FORMATTING EXAMPLES:

    For GitHub repository data:
    \`\`\`markdown
    # 📦 Repository: owner/repo-name

    ## 🚀 Latest Release: v1.2.3
    - **Published:** March 15, 2024
    - **Author:** @username
    - **Downloads:** 1,234 total

    ## 📊 Repository Stats
    | Metric | Value |
    |--------|--------|
    | ⭐ Stars | 1,234 |
    | 🍴 Forks | 89 |
    | 📝 Issues | 23 open |

    ## 💾 Download Options
    - [Windows Setup](url) - 45 downloads
    - [macOS DMG](url) - 234 downloads
    - [Linux AppImage](url) - 123 downloads

    ## 📈 Recent Activity
    The repository shows active development with regular commits and community engagement.
    \`\`\`

    Remember: Always interpret and format tool results beautifully. Never show raw data!`,
    onFinish: async () => {
      // Close all MCP clients
      for (const client of clients) {
        try {
          await client.close();
        } catch {
          // Ignore close errors
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
