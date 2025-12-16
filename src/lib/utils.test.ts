import { describe, expect, it } from "vitest";
import type { V0ServerJson } from "@/generated/types.gen";
import { isVirtualMCPServer } from "./utils";

const testCases = [
  {
    description: "kubernetes_kind is VirtualMCPServer",
    server: {
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
    } as V0ServerJson,
    expected: true,
  },
  {
    description: "kubernetes_kind is MCPServer (not Virtual)",
    server: {
      name: "mcp-server",
      title: "MCP Server",
      _meta: {
        "io.modelcontextprotocol.registry/publisher-provided": {
          "io.github.stacklok": {
            "https://mcp.example.com/servers/mcp-server": {
              metadata: {
                kubernetes_kind: "MCPServer",
              },
            },
          },
        },
      },
    } as V0ServerJson,
    expected: false,
  },
  {
    description: "regular server without VirtualMCPServer",
    server: {
      name: "regular-server",
      title: "Regular Server",
    } as V0ServerJson,
    expected: false,
  },
];

describe("isVirtualMCPServer", () => {
  it.each(testCases)("returns $expected when $description", ({
    server,
    expected,
  }) => {
    expect(isVirtualMCPServer(server)).toBe(expected);
  });
});
