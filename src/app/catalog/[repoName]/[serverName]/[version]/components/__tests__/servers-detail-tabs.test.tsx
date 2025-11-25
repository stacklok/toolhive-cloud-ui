import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServersDetailTabs } from "../servers-detail-tabs";

describe("ServersDetailTabs", () => {
  const mockProps = {
    description: "Test server description",
    serverUrl: "https://test-server.example.com",
    repositoryUrl: "https://github.com/test/repo",
  };

  describe("tabs rendering", () => {
    it("displays About tab", () => {
      render(<ServersDetailTabs {...mockProps} />);

      expect(screen.getByRole("tab", { name: /about/i })).toBeVisible();
    });

    it("displays Tools tab", () => {
      render(<ServersDetailTabs {...mockProps} />);

      expect(screen.getByRole("tab", { name: /tools/i })).toBeVisible();
    });

    it("has About tab selected by default", () => {
      render(<ServersDetailTabs {...mockProps} />);

      const aboutTab = screen.getByRole("tab", { name: /about/i });
      expect(aboutTab).toHaveAttribute("data-state", "active");
    });

    it("has Tools tab disabled", () => {
      render(<ServersDetailTabs {...mockProps} />);

      const toolsTab = screen.getByRole("tab", { name: /tools/i });
      expect(toolsTab).toBeDisabled();
    });
  });

  describe("tab content", () => {
    it("displays About tab content by default", () => {
      render(<ServersDetailTabs {...mockProps} />);

      expect(screen.getByText(mockProps.description)).toBeVisible();
    });

    it("displays server URL in About content", () => {
      render(<ServersDetailTabs {...mockProps} />);

      expect(screen.getByRole("button", { name: /copy url/i })).toBeVisible();
      expect(screen.getByDisplayValue(mockProps.serverUrl)).toBeVisible();
    });

    it("displays repository URL button when provided", () => {
      render(<ServersDetailTabs {...mockProps} />);

      const repoLink = screen.getByRole("link", { name: /view repository/i });
      expect(repoLink).toBeVisible();
      expect(repoLink).toHaveAttribute("href", mockProps.repositoryUrl);
    });

    it("does not display repository button when URL is not provided", () => {
      render(
        <ServersDetailTabs
          description={mockProps.description}
          serverUrl={mockProps.serverUrl}
        />,
      );

      expect(
        screen.queryByRole("link", { name: /view repository/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("optional props", () => {
    it("works with minimal props", () => {
      render(<ServersDetailTabs serverUrl="https://example.com" />);

      expect(screen.getByRole("tab", { name: /about/i })).toBeVisible();
      expect(screen.getByDisplayValue("https://example.com")).toBeVisible();
    });

    it("displays default description when not provided", () => {
      render(<ServersDetailTabs serverUrl="https://example.com" />);

      expect(screen.getByText("No description available")).toBeVisible();
    });
  });
});
