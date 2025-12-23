"use server";

import type {
  MCPServerWithTools,
  VirtualMCPServer,
  VirtualMCPServerSpec,
  ListMCPServersWithToolsResponse,
  ListVMCPResponse,
} from "./types";
import { mockMCPServersWithTools } from "./mocks/fixtures";

// For POC, use mock server URL. In production, this would be the API URL.
const API_BASE = process.env.VMCP_API_URL ?? "http://localhost:8080";

/**
 * Fetch available MCP servers with their tools.
 * For POC, returns mock data directly to avoid SSR fetch issues.
 */
export async function getMCPServersWithTools(): Promise<MCPServerWithTools[]> {
  // POC: Return mock data directly on server side to avoid fetch complexity
  if (process.env.NODE_ENV === "development") {
    return mockMCPServersWithTools;
  }

  const res = await fetch(`${API_BASE}/api/vmcp/servers`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch MCP servers");
  }

  const data: ListMCPServersWithToolsResponse = await res.json();
  return data.servers;
}

/**
 * Fetch all saved vMCP configurations.
 */
export async function getVMCPs(): Promise<VirtualMCPServer[]> {
  const res = await fetch(`${API_BASE}/api/vmcp`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch vMCPs");
  }

  const data: ListVMCPResponse = await res.json();
  return data.vmcps;
}

/**
 * Create a new vMCP configuration.
 */
export async function createVMCP(
  spec: VirtualMCPServerSpec,
): Promise<VirtualMCPServer> {
  const res = await fetch(`${API_BASE}/api/vmcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spec }),
  });

  if (!res.ok) {
    throw new Error("Failed to create vMCP");
  }

  return res.json();
}

/**
 * Get YAML preview for a vMCP spec.
 */
export async function getVMCPYamlPreview(
  spec: VirtualMCPServerSpec,
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/vmcp/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spec }),
  });

  if (!res.ok) {
    throw new Error("Failed to get YAML preview");
  }

  const data: { yaml: string } = await res.json();
  return data.yaml;
}

/**
 * Deploy a vMCP.
 */
export async function deployVMCP(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/vmcp/${id}/deploy`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to deploy vMCP");
  }
}

/**
 * Delete a vMCP.
 */
export async function deleteVMCP(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/vmcp/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete vMCP");
  }
}

