import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { V0ServerJson } from "@/generated/types.gen";
import { parseStacklokMeta, type ServerTool } from "./schemas/server-meta";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if a server is a Virtual MCP server by examining metadata.
 * Virtual MCP servers have kubernetes.kind set to "VirtualMCPServer" in their metadata.
 */
export function isVirtualMCPServer(server: V0ServerJson): boolean {
  const result = parseStacklokMeta(server);
  if (!result.success) return false;

  return Object.values(result.data).some(
    (t) => t.metadata?.kubernetes?.kind === "VirtualMCPServer",
  );
}

/**
 * Extracts MCP tools from a server's publisher-provided metadata.
 * Tools are stored alongside `metadata` in the stacklok transport entries.
 */
export function getTools(server: V0ServerJson): ServerTool[] {
  const result = parseStacklokMeta(server);
  if (!result.success) return [];

  return Object.values(result.data).flatMap((t) => t.tool_definitions ?? []);
}
