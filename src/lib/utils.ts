import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { V0ServerJson } from "@/generated/types.gen";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if a server is a Virtual MCP server by examining metadata.
 * Virtual MCP servers have kubernetes_kind set to "VirtualMCPServer" in their metadata.
 * transportUrl = URL where the MCP server is accessible (e.g. "https://mcp.example.com/servers/my-server")
 */
export function isVirtualMCPServer(server: V0ServerJson): boolean {
  const stacklokMeta =
    server._meta?.["io.modelcontextprotocol.registry/publisher-provided"]?.[
      "io.github.stacklok"
    ];

  if (!stacklokMeta || typeof stacklokMeta !== "object") {
    return false;
  }

  // Check all transport URLs for VirtualMCPServer metadata
  return Object.values(stacklokMeta).some((transportData) => {
    if (!transportData || typeof transportData !== "object") {
      return false;
    }
    if (!("metadata" in transportData)) {
      return false;
    }
    const metadata = transportData.metadata;
    return (
      metadata &&
      typeof metadata === "object" &&
      "kubernetes_kind" in metadata &&
      metadata.kubernetes_kind === "VirtualMCPServer"
    );
  });
}
