import { describe, expect, it } from "vitest";
import type { V0ServerJson } from "@/generated/types.gen";
import { mockedGetRegistryV01Servers } from "@/mocks/fixtures/registry_v0_1_servers/get";
import { getTools, isVirtualMCPServer } from "./utils";

const servers = mockedGetRegistryV01Servers.defaultValue.servers!;

const osvServer = servers.find(
  (s) => s.server?.name === "com.toolhive.k8s.toolhive-system/osv",
)!.server as V0ServerJson;

const virtualMcpServer = servers.find(
  (s) => s.server?.name === "com.toolhive.k8s.production/my-vmcp-server",
)!.server as V0ServerJson;

const regularServer: V0ServerJson = {
  name: "regular-server",
  title: "Regular Server",
};

describe("isVirtualMCPServer", () => {
  it("returns true when kubernetes.kind is VirtualMCPServer", () => {
    expect(isVirtualMCPServer(virtualMcpServer)).toBe(true);
  });

  it("returns false when kubernetes.kind is MCPServer", () => {
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
