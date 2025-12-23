export { MCPServerNode } from "./mcp-server-node";
export { OutputNode } from "./output-node";

import { MCPServerNode } from "./mcp-server-node";
import { OutputNode } from "./output-node";

export const nodeTypes = {
  mcpServer: MCPServerNode,
  output: OutputNode,
} as const;
