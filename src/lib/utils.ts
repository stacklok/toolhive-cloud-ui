import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { V0ServerJson } from "@/generated/types.gen";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if a server is a Virtual MCP server by examining metadata.
 * Virtual MCP servers have kubernetes_kind set to "VirtualMCPServer" in their metadata.
 */
export function isVirtualMCPServer(server: V0ServerJson): boolean {
  const publisherMeta =
    server._meta?.["io.modelcontextprotocol.registry/publisher-provided"];

  if (!publisherMeta || typeof publisherMeta !== "object") {
    return false;
  }

  const stacklokMeta = publisherMeta["io.github.stacklok"];
  if (!stacklokMeta || typeof stacklokMeta !== "object") {
    return false;
  }

  // Check all transport URLs for VirtualMCPServer metadata
  for (const transportUrl in stacklokMeta) {
    const transportData = (stacklokMeta as Record<string, unknown>)[
      transportUrl
    ];
    if (
      transportData &&
      typeof transportData === "object" &&
      "metadata" in transportData &&
      transportData.metadata &&
      typeof transportData.metadata === "object" &&
      "kubernetes_kind" in transportData.metadata &&
      transportData.metadata.kubernetes_kind === "VirtualMCPServer"
    ) {
      return true;
    }
  }

  return false;
}
