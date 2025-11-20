import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { V0ServerJson } from "@/generated/types.gen";
import { ServerCard } from "./server-card";

describe("ServerCard", () => {
  const mockServer: V0ServerJson = {
    name: "test-org/test-server",
    description: "This is a test server for MCP",
    repository: {
      id: "test-org",
      source: "github",
      url: "https://github.com/test-org/test-server",
    },
  };

  it("renders server information with name, author and description", () => {
    render(<ServerCard server={mockServer} url="/servers/test-server" />);

    expect(screen.getByText("test-org/test-server")).toBeTruthy();
    expect(screen.getByText("test-org")).toBeTruthy();
    expect(screen.getByText("This is a test server for MCP")).toBeTruthy();
  });

  it("does not render author when repository data is missing", () => {
    const minimalServer: V0ServerJson = {
      name: undefined,
      description: undefined,
      repository: undefined,
    };
    const { container } = render(<ServerCard server={minimalServer} />);

    const authorElement = container.querySelector(
      '[data-slot="card-description"]',
    );

    expect(authorElement?.textContent).toBeFalsy();
    expect(screen.getByText("No description available")).toBeTruthy();
  });

  it("renders copy URL button", () => {
    render(<ServerCard server={mockServer} url="/servers/test-server" />);

    const copyButton = screen.getByRole("button", { name: /copy url/i });
    expect(copyButton).toBeTruthy();
  });
});
