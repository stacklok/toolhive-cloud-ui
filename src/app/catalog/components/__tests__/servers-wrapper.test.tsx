import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it } from "vitest";
import type { V0ServerJson } from "@/generated/types.gen";
import { ServersWrapper } from "../servers-wrapper";

function renderWithNuqs(
  ui: React.ReactElement,
  searchParams?: URLSearchParams,
) {
  return render(
    <NuqsTestingAdapter searchParams={searchParams}>{ui}</NuqsTestingAdapter>,
  );
}

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
    renderWithNuqs(<ServersWrapper servers={mockServers} />);

    expect(screen.getByText("MCP Server Catalog")).toBeVisible();
  });

  it("has catalog filters", () => {
    renderWithNuqs(<ServersWrapper servers={mockServers} />);

    expect(screen.getByLabelText("List view")).toBeVisible();
    expect(screen.getByLabelText("Grid view")).toBeVisible();
    expect(screen.getByPlaceholderText("Search")).toBeVisible();
  });

  it("displays servers in grid mode by default", () => {
    renderWithNuqs(<ServersWrapper servers={mockServers} />);

    expect(screen.getByText("aws-nova-canvas")).toBeVisible();
    expect(screen.getByText("google-applications")).toBeVisible();
  });

  it("switches to list mode when list button is clicked", async () => {
    const user = userEvent.setup();
    renderWithNuqs(<ServersWrapper servers={mockServers} />);

    await user.click(screen.getByLabelText("List view"));

    await waitFor(() => {
      expect(screen.getByText("Server")).toBeVisible();
      expect(screen.getByText("About")).toBeVisible();
      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
    });
  });

  it("switches back to grid mode when grid button is clicked", async () => {
    const user = userEvent.setup();
    renderWithNuqs(<ServersWrapper servers={mockServers} />);

    await user.click(screen.getByLabelText("List view"));
    await user.click(screen.getByLabelText("Grid view"));

    await waitFor(() => {
      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
      expect(screen.queryByText("Server")).not.toBeInTheDocument();
    });
  });

  it("filters servers when typing in search", async () => {
    const user = userEvent.setup();
    renderWithNuqs(<ServersWrapper servers={mockServers} />);

    const searchInput = screen.getByPlaceholderText("Search");
    await user.type(searchInput, "aws");

    await waitFor(() => {
      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
      expect(screen.queryByText("google-applications")).not.toBeInTheDocument();
    });
  });

  it("shows no results message when search has no matches", async () => {
    const user = userEvent.setup();
    renderWithNuqs(<ServersWrapper servers={mockServers} />);

    const searchInput = screen.getByPlaceholderText("Search");
    await user.type(searchInput, "nonexistent");

    await waitFor(() => {
      expect(
        screen.getByText('No servers found matching "nonexistent"'),
      ).toBeVisible();
    });
  });

  it("maintains search when switching view modes", async () => {
    const user = userEvent.setup();
    renderWithNuqs(<ServersWrapper servers={mockServers} />);

    const searchInput = screen.getByPlaceholderText(
      "Search",
    ) as HTMLInputElement;
    await user.type(searchInput, "aws");

    await waitFor(() => {
      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
      expect(screen.queryByText("google-applications")).not.toBeInTheDocument();
    });

    await user.click(screen.getByLabelText("List view"));

    await waitFor(() => {
      expect(screen.getByText("Server")).toBeVisible();
    });

    expect(searchInput.value).toBe("aws");

    await waitFor(() => {
      const awsCanvas = screen.queryByText("aws-nova-canvas");
      const googleApps = screen.queryByText("google-applications");

      expect(awsCanvas).toBeInTheDocument();
      expect(awsCanvas).toBeVisible();
      expect(googleApps).not.toBeInTheDocument();
    });
  });
});
