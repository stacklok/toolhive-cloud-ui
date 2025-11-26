import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServerDetail } from "../server-detail";

describe("ServerDetail", () => {
  const mockProps = {
    description: "Test server description",
    serverUrl: "https://test-server.example.com",
    repositoryUrl: "https://github.com/test/repo",
  };

  describe("server description", () => {
    it("displays server description", () => {
      render(<ServerDetail {...mockProps} />);

      expect(screen.getByText(mockProps.description)).toBeVisible();
    });

    it("displays default description when not provided", () => {
      render(<ServerDetail serverUrl={mockProps.serverUrl} />);

      expect(screen.getByText("No description available")).toBeVisible();
    });
  });

  describe("repository link", () => {
    it("displays repository link when URL is provided", () => {
      render(<ServerDetail {...mockProps} />);

      const repoLink = screen.getByRole("link", { name: /view repository/i });
      expect(repoLink).toBeVisible();
      expect(repoLink).toHaveAttribute("href", mockProps.repositoryUrl);
      expect(repoLink).toHaveAttribute("target", "_blank");
      expect(repoLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("does not display repository link when URL is not provided", () => {
      render(
        <ServerDetail
          description={mockProps.description}
          serverUrl={mockProps.serverUrl}
        />,
      );

      expect(
        screen.queryByRole("link", { name: /view repository/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("getting started section", () => {
    it("displays getting started heading", () => {
      render(<ServerDetail {...mockProps} />);

      expect(
        screen.getByRole("heading", { name: /getting started/i }),
      ).toBeVisible();
    });

    it("displays getting started description", () => {
      render(<ServerDetail {...mockProps} />);

      expect(
        screen.getByText(
          /copy the endpoint url below and use it within your application/i,
        ),
      ).toBeVisible();
    });

    it("displays server URL input when provided", () => {
      render(<ServerDetail {...mockProps} />);

      const input = screen.getByDisplayValue(mockProps.serverUrl);
      expect(input).toBeVisible();
      expect(input).toHaveAttribute("readonly");
    });

    it("displays copy URL button when server URL is provided", () => {
      render(<ServerDetail {...mockProps} />);

      expect(screen.getByRole("button", { name: /copy url/i })).toBeVisible();
    });

    it("does not display input or copy button when server URL is not provided", () => {
      render(<ServerDetail description={mockProps.description} />);

      expect(
        screen.queryByDisplayValue(mockProps.serverUrl),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /copy url/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("integration scenarios", () => {
    it("renders correctly with all props provided", () => {
      render(<ServerDetail {...mockProps} />);

      expect(screen.getByText(mockProps.description)).toBeVisible();
      expect(
        screen.getByRole("link", { name: /view repository/i }),
      ).toBeVisible();
      expect(screen.getByDisplayValue(mockProps.serverUrl)).toBeVisible();
      expect(screen.getByRole("button", { name: /copy url/i })).toBeVisible();
    });

    it("renders correctly with minimal props (only serverUrl)", () => {
      render(<ServerDetail serverUrl="https://example.com" />);

      expect(screen.getByText("No description available")).toBeVisible();
      expect(screen.getByDisplayValue("https://example.com")).toBeVisible();
      expect(
        screen.queryByRole("link", { name: /view repository/i }),
      ).not.toBeInTheDocument();
    });

    it("renders correctly with only description and serverUrl", () => {
      render(
        <ServerDetail
          description="Custom description"
          serverUrl="https://example.com"
        />,
      );

      expect(screen.getByText("Custom description")).toBeVisible();
      expect(screen.getByDisplayValue("https://example.com")).toBeVisible();
      expect(
        screen.queryByRole("link", { name: /view repository/i }),
      ).not.toBeInTheDocument();
    });
  });
});
