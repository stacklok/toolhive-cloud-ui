import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { V0ServerJson } from "@/generated/types.gen";
import { CatalogView } from "../catalog-view";

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

describe("CatalogView", () => {
  describe("grid mode", () => {
    it("renders servers in grid layout", () => {
      render(
        <CatalogView servers={mockServers} viewMode="grid" searchQuery="" />,
      );

      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
      expect(screen.getByText("google-applications")).toBeVisible();
      expect(screen.getByText("azure-mcp")).toBeVisible();
    });

    it("displays grid container", () => {
      const { container } = render(
        <CatalogView servers={mockServers} viewMode="grid" searchQuery="" />,
      );

      const grid = container.querySelector(".grid");
      expect(grid).toBeVisible();
    });
  });

  describe("list mode", () => {
    it("renders servers in table layout", () => {
      render(
        <CatalogView servers={mockServers} viewMode="list" searchQuery="" />,
      );

      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
      expect(screen.getByText("google-applications")).toBeVisible();
      expect(screen.getByText("azure-mcp")).toBeVisible();
    });

    it("displays table headers", () => {
      render(
        <CatalogView servers={mockServers} viewMode="list" searchQuery="" />,
      );

      expect(screen.getByText("Server")).toBeVisible();
      expect(screen.getByText("About")).toBeVisible();
    });
  });

  describe("search functionality", () => {
    it("filters servers by name", () => {
      render(
        <CatalogView servers={mockServers} viewMode="grid" searchQuery="aws" />,
      );

      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
      expect(screen.queryByText("google-applications")).not.toBeInTheDocument();
      expect(screen.queryByText("azure-mcp")).not.toBeInTheDocument();
    });

    it("filters servers by title", () => {
      render(
        <CatalogView
          servers={mockServers}
          viewMode="grid"
          searchQuery="google"
        />,
      );

      expect(screen.getByText("google-applications")).toBeVisible();
      expect(screen.queryByText("aws-nova-canvas")).not.toBeInTheDocument();
    });

    it("filters servers by description", () => {
      render(
        <CatalogView
          servers={mockServers}
          viewMode="grid"
          searchQuery="workspace"
        />,
      );

      expect(screen.getByText("google-applications")).toBeVisible();
      expect(screen.queryByText("aws-nova-canvas")).not.toBeInTheDocument();
    });

    it("is case insensitive", () => {
      render(
        <CatalogView servers={mockServers} viewMode="grid" searchQuery="AWS" />,
      );

      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
    });

    it("shows no results message when search has no matches", () => {
      render(
        <CatalogView
          servers={mockServers}
          viewMode="grid"
          searchQuery="nonexistent"
        />,
      );

      expect(
        screen.getByText('No servers found matching "nonexistent"'),
      ).toBeVisible();
    });
  });

  describe("empty state", () => {
    it("shows no servers message when list is empty", () => {
      render(<CatalogView servers={[]} viewMode="grid" searchQuery="" />);

      expect(screen.getByText("No servers available")).toBeVisible();
    });

    it("shows no servers message in list mode", () => {
      render(<CatalogView servers={[]} viewMode="list" searchQuery="" />);

      expect(screen.getByText("No servers available")).toBeVisible();
    });
  });
});
