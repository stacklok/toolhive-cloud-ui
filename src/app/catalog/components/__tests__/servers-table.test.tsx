import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { V0ServerJson } from "@/generated/types.gen";
import { ServersTable } from "../servers-table";

describe("ServersTable", () => {
  const mockServer: V0ServerJson = {
    name: "test-org/test-server",
    description: "This is a test server for MCP",
    remotes: [
      {
        url: "https://mcp.example.com/test-server",
      },
    ],
    repository: {
      id: "test-org",
      source: "github",
      url: "https://github.com/test-org/test-server",
    },
  };

  const virtualMCPServer: V0ServerJson = {
    name: "com.toolhive.k8s.production/my-vmcp-server",
    description: "Virtual MCP server",
    remotes: [
      {
        url: "https://mcp.example.com/servers/my-vmcp-server",
      },
    ],
    _meta: {
      "io.modelcontextprotocol.registry/publisher-provided": {
        "io.github.stacklok": {
          "https://mcp.example.com/servers/my-vmcp-server": {
            metadata: {
              kubernetes: {
                kind: "VirtualMCPServer",
              },
            },
          },
        },
      },
    },
  };

  it("renders table with server information", () => {
    render(<ServersTable servers={[mockServer]} />);

    expect(screen.getByText("test-org/test-server")).toBeVisible();
    expect(screen.getByText("This is a test server for MCP")).toBeVisible();
  });

  it("renders multiple servers", () => {
    const servers = [
      mockServer,
      {
        ...mockServer,
        name: "another-org/another-server",
        description: "Another test server",
      },
    ];

    render(<ServersTable servers={servers} />);

    expect(screen.getByText("test-org/test-server")).toBeVisible();
    expect(screen.getByText("another-org/another-server")).toBeVisible();
  });

  it("displays copy URL button when URL is available", () => {
    render(<ServersTable servers={[mockServer]} />);

    const copyButton = screen.getByRole("button", { name: /copy url/i });
    expect(copyButton).toBeVisible();
  });

  it("does not display copy URL button when URL is missing", () => {
    const serverWithoutUrl: V0ServerJson = {
      ...mockServer,
      remotes: [],
    };

    render(<ServersTable servers={[serverWithoutUrl]} />);

    expect(
      screen.queryByRole("button", { name: /copy url/i }),
    ).not.toBeInTheDocument();
  });

  it("handles servers with missing description", () => {
    const serverWithoutDescription: V0ServerJson = {
      ...mockServer,
      description: undefined,
    };

    render(<ServersTable servers={[serverWithoutDescription]} />);

    expect(screen.getByText("No description available")).toBeVisible();
  });

  it("handles servers with missing name", () => {
    const serverWithoutName: V0ServerJson = {
      ...mockServer,
      name: undefined,
    };

    render(<ServersTable servers={[serverWithoutName]} />);

    expect(screen.getByText("Unknown")).toBeVisible();
  });

  it("displays Virtual MCP badge for Virtual MCP servers", () => {
    render(<ServersTable servers={[virtualMCPServer]} />);

    expect(screen.getByText("Virtual MCP")).toBeVisible();
  });

  it("does not display Virtual MCP badge for regular servers", () => {
    render(<ServersTable servers={[mockServer]} />);

    expect(screen.queryByText("Virtual MCP")).not.toBeInTheDocument();
  });

  it("displays Virtual MCP badge only for Virtual MCP servers in mixed list", () => {
    render(<ServersTable servers={[mockServer, virtualMCPServer]} />);

    const badges = screen.queryAllByText("Virtual MCP");
    expect(badges).toHaveLength(1);
  });

  it("renders empty table body when no servers are provided", () => {
    const { container } = render(<ServersTable servers={[]} />);

    const tableBody = container.querySelector("tbody");
    expect(tableBody?.children).toHaveLength(0);
  });
});
