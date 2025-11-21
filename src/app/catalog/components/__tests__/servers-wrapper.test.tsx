import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { V0ServerJson } from "@/generated/types.gen";
import { ServersWrapper } from "../servers-wrapper";

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
];

describe("ServersWrapper", () => {
  it("has header with title", () => {
    render(<ServersWrapper servers={mockServers} />);

    expect(screen.getByText("MCP Server Catalog")).toBeInTheDocument();
  });

  it("has catalog filters", () => {
    render(<ServersWrapper servers={mockServers} />);

    expect(screen.getByLabelText("List view")).toBeInTheDocument();
    expect(screen.getByLabelText("Grid view")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search")).toBeInTheDocument();
  });

  it("displays servers in grid mode by default", () => {
    render(<ServersWrapper servers={mockServers} />);

    expect(screen.getByText("aws-nova-canvas")).toBeInTheDocument();
    expect(screen.getByText("google-applications")).toBeInTheDocument();
  });

  it("switches to list mode when list button is clicked", async () => {
    const user = userEvent.setup();
    render(<ServersWrapper servers={mockServers} />);

    await user.click(screen.getByLabelText("List view"));

    expect(screen.getByText("Server")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("aws-nova-canvas")).toBeInTheDocument();
  });

  it("switches back to grid mode when grid button is clicked", async () => {
    const user = userEvent.setup();
    render(<ServersWrapper servers={mockServers} />);

    await user.click(screen.getByLabelText("List view"));
    await user.click(screen.getByLabelText("Grid view"));

    expect(screen.getByText("aws-nova-canvas")).toBeInTheDocument();
    expect(screen.queryByText("Server")).not.toBeInTheDocument();
  });

  it("filters servers when typing in search", async () => {
    const user = userEvent.setup();
    render(<ServersWrapper servers={mockServers} />);

    const searchInput = screen.getByPlaceholderText("Search");
    await user.type(searchInput, "aws");

    expect(screen.getByText("aws-nova-canvas")).toBeInTheDocument();
    expect(screen.queryByText("google-applications")).not.toBeInTheDocument();
  });

  it("shows no results message when search has no matches", async () => {
    const user = userEvent.setup();
    render(<ServersWrapper servers={mockServers} />);

    const searchInput = screen.getByPlaceholderText("Search");
    await user.type(searchInput, "nonexistent");

    expect(
      screen.getByText('No servers found matching "nonexistent"'),
    ).toBeInTheDocument();
  });

  it("maintains search when switching view modes", async () => {
    const user = userEvent.setup();
    render(<ServersWrapper servers={mockServers} />);

    const searchInput = screen.getByPlaceholderText("Search");
    await user.type(searchInput, "aws");

    expect(screen.getByText("aws-nova-canvas")).toBeInTheDocument();
    expect(screen.queryByText("google-applications")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("List view"));

    expect(screen.getByText("aws-nova-canvas")).toBeInTheDocument();
    expect(screen.queryByText("google-applications")).not.toBeInTheDocument();
  });
});
