import { describe, expect, it } from "vitest";
import type { V0ServerJson } from "@/generated/types.gen";
import { getTools, isVirtualMCPServer } from "./utils";

const osvServer: V0ServerJson = {
  name: "com.toolhive.k8s.toolhive-system/osv",
  description:
    "OSV (Open Source Vulnerabilities) database access for querying package and commit vulnerabilities",
  version: "1.0.0",
  remotes: [
    {
      type: "streamable-http",
      url: "https://mcp.stacklok.dev/osv/mcp",
    },
  ],
  _meta: {
    "io.modelcontextprotocol.registry/publisher-provided": {
      "io.github.stacklok": {
        "https://mcp.stacklok.dev/osv/mcp": {
          metadata: {
            kubernetes_image:
              "781189302813.dkr.ecr.us-east-1.amazonaws.com/stackloklabs/osv-mcp/server",
            kubernetes_kind: "MCPServer",
            kubernetes_name: "osv",
            kubernetes_namespace: "toolhive-system",
            kubernetes_transport: "streamable-http",
            kubernetes_uid: "a47c2d8d-b15a-4d2e-a7ff-b1e0b5ce410f",
          },
          tool_definitions: [
            {
              name: "get_vulnerability",
              description: "Get details for a specific vulnerability by ID",
            },
            {
              name: "query_vulnerabilities_batch",
              description:
                "Query for vulnerabilities affecting multiple packages or commits at once",
            },
            {
              name: "query_vulnerability",
              description:
                "Query for vulnerabilities affecting a specific package version or commit",
            },
          ],
          tools: [
            "query_vulnerability",
            "query_vulnerabilities_batch",
            "get_vulnerability",
          ],
        },
      },
    },
  },
};

const virtualMcpServer: V0ServerJson = {
  name: "com.toolhive.k8s.production/my-vmcp-server",
  title: "Virtual MCP Server",
  _meta: {
    "io.modelcontextprotocol.registry/publisher-provided": {
      "io.github.stacklok": {
        "https://mcp.example.com/servers/my-vmcp-server": {
          metadata: {
            kubernetes_kind: "VirtualMCPServer",
          },
        },
      },
    },
  },
};

const regularServer: V0ServerJson = {
  name: "regular-server",
  title: "Regular Server",
};

describe("isVirtualMCPServer", () => {
  it("returns true when kubernetes_kind is VirtualMCPServer", () => {
    expect(isVirtualMCPServer(virtualMcpServer)).toBe(true);
  });

  it("returns false when kubernetes_kind is MCPServer", () => {
    expect(isVirtualMCPServer(osvServer)).toBe(false);
  });

  it("returns false for a regular server without _meta", () => {
    expect(isVirtualMCPServer(regularServer)).toBe(false);
  });
});

describe("getTools", () => {
  it("extracts tool_definitions from server metadata", () => {
    const tools = getTools(osvServer);
    expect(tools).toEqual([
      {
        name: "get_vulnerability",
        description: "Get details for a specific vulnerability by ID",
      },
      {
        name: "query_vulnerabilities_batch",
        description:
          "Query for vulnerabilities affecting multiple packages or commits at once",
      },
      {
        name: "query_vulnerability",
        description:
          "Query for vulnerabilities affecting a specific package version or commit",
      },
    ]);
  });

  it("returns empty array for a server without tool_definitions", () => {
    expect(getTools(virtualMcpServer)).toEqual([]);
  });

  it("returns empty array for a server without _meta", () => {
    expect(getTools(regularServer)).toEqual([]);
  });
});
