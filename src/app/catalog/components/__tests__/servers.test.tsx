import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { V0ServerJson } from "@/generated/types.gen";
import { Servers } from "../servers";

const mockOnClearSearch = vi.fn();

const mockServers: V0ServerJson[] = [
  {
    name: "aws-nova-canvas",
    title: "AWS Nova Canvas",
    description: "Image generation using Amazon Nova Canvas",
    websiteUrl: "https://github.com/awslabs/aws-nova-canvas",
  },
  {
    name: "google-applications",
    title: "Google Applications",
    description: "Access your Google Workspace apps",
    websiteUrl: "https://github.com/google/mcp-google-apps",
  },
  {
    name: "azure-mcp",
    title: "Azure MCP",
    description: "Connect AI assistants to Azure services",
    remotes: [{ type: "http", url: "https://example.com/azure" }],
  },
];

describe("Servers", () => {
  describe("grid mode", () => {
    it("displays servers in grid layout", () => {
      render(
        <Servers
          servers={mockServers}
          viewMode="grid"
          searchQuery=""
          onClearSearch={mockOnClearSearch}
        />,
      );

      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
      expect(screen.getByText("google-applications")).toBeVisible();
      expect(screen.getByText("azure-mcp")).toBeVisible();
    });

    it("displays grid container", () => {
      const { container } = render(
        <Servers
          servers={mockServers}
          viewMode="grid"
          searchQuery=""
          onClearSearch={mockOnClearSearch}
        />,
      );

      const grid = container.querySelector(".grid");
      expect(grid).toBeVisible();
    });
  });

  describe("list mode", () => {
    it("displays servers in table layout", () => {
      render(
        <Servers
          servers={mockServers}
          viewMode="list"
          searchQuery=""
          onClearSearch={mockOnClearSearch}
        />,
      );

      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
      expect(screen.getByText("google-applications")).toBeVisible();
      expect(screen.getByText("azure-mcp")).toBeVisible();
    });

    it("displays table headers", () => {
      render(
        <Servers
          servers={mockServers}
          viewMode="list"
          searchQuery=""
          onClearSearch={mockOnClearSearch}
        />,
      );

      expect(screen.getByText("Server")).toBeVisible();
      expect(screen.getByText("About")).toBeVisible();
    });
  });

  describe("search functionality", () => {
    it("filters servers by name", () => {
      render(
        <Servers
          servers={mockServers}
          viewMode="grid"
          searchQuery="aws"
          onClearSearch={mockOnClearSearch}
        />,
      );

      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
      expect(screen.queryByText("google-applications")).not.toBeInTheDocument();
      expect(screen.queryByText("azure-mcp")).not.toBeInTheDocument();
    });

    it("filters servers by title", () => {
      render(
        <Servers
          servers={mockServers}
          viewMode="grid"
          searchQuery="google"
          onClearSearch={mockOnClearSearch}
        />,
      );

      expect(screen.getByText("google-applications")).toBeVisible();
      expect(screen.queryByText("aws-nova-canvas")).not.toBeInTheDocument();
    });

    it("filters servers by description", () => {
      render(
        <Servers
          servers={mockServers}
          viewMode="grid"
          searchQuery="workspace"
          onClearSearch={mockOnClearSearch}
        />,
      );

      expect(screen.getByText("google-applications")).toBeVisible();
      expect(screen.queryByText("aws-nova-canvas")).not.toBeInTheDocument();
    });

    it("is case insensitive", () => {
      render(
        <Servers
          servers={mockServers}
          viewMode="grid"
          searchQuery="AWS"
          onClearSearch={mockOnClearSearch}
        />,
      );

      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
    });

    it("shows no results message when search has no matches", () => {
      render(
        <Servers
          servers={mockServers}
          viewMode="grid"
          searchQuery="nonexistent"
          onClearSearch={mockOnClearSearch}
        />,
      );

      expect(screen.getByText("No results found")).toBeVisible();
      expect(
        screen.getByText(/couldn't find any servers matching "nonexistent"/),
      ).toBeVisible();
    });

    it("shows clear search button when search has no matches", async () => {
      const user = userEvent.setup();
      const onClearSearch = vi.fn();

      render(
        <Servers
          servers={mockServers}
          viewMode="grid"
          searchQuery="nonexistent"
          onClearSearch={onClearSearch}
        />,
      );

      const clearButton = screen.getByRole("button", { name: /clear search/i });
      expect(clearButton).toBeVisible();

      await user.click(clearButton);
      expect(onClearSearch).toHaveBeenCalledTimes(1);
    });
  });

  describe("empty state", () => {
    it("shows no servers message when list is empty", () => {
      render(
        <Servers
          servers={[]}
          viewMode="grid"
          searchQuery=""
          onClearSearch={mockOnClearSearch}
        />,
      );

      expect(screen.getByText("No servers available")).toBeVisible();
      expect(
        screen.getByText(/no MCP servers in the catalog yet/i),
      ).toBeVisible();
    });

    it("shows no servers message in list mode", () => {
      render(
        <Servers
          servers={[]}
          viewMode="list"
          searchQuery=""
          onClearSearch={mockOnClearSearch}
        />,
      );

      expect(screen.getByText("No servers available")).toBeVisible();
    });

    it("displays illustration in empty state", () => {
      const { container } = render(
        <Servers
          servers={[]}
          viewMode="grid"
          searchQuery=""
          onClearSearch={mockOnClearSearch}
        />,
      );

      expect(container.querySelector("svg")).toBeVisible();
    });

    it("does not show clear search button when no servers and no search", () => {
      render(
        <Servers
          servers={[]}
          viewMode="grid"
          searchQuery=""
          onClearSearch={mockOnClearSearch}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /clear search/i }),
      ).not.toBeInTheDocument();
    });
  });
});
