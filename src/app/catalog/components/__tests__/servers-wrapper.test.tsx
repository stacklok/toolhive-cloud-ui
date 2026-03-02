import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it } from "vitest";
import type {
  GithubComStacklokToolhiveRegistryServerInternalServiceRegistryInfo,
  V0ServerJson,
} from "@/generated/types.gen";
import { ServersWrapper } from "../servers-wrapper";

function renderWithNuqs(
  ui: React.ReactElement,
  searchParams?: URLSearchParams,
) {
  return render(
    <NuqsTestingAdapter searchParams={searchParams}>{ui}</NuqsTestingAdapter>,
  );
}

const mockRegistries: GithubComStacklokToolhiveRegistryServerInternalServiceRegistryInfo[] =
  [{ name: "default-registry" }, { name: "custom-registry" }];

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
    renderWithNuqs(
      <ServersWrapper servers={mockServers} registries={mockRegistries} />,
    );

    expect(screen.getByText("MCP Server Catalog")).toBeVisible();
  });

  it("has catalog filters", () => {
    renderWithNuqs(
      <ServersWrapper servers={mockServers} registries={mockRegistries} />,
    );

    expect(screen.getByLabelText("List view")).toBeVisible();
    expect(screen.getByLabelText("Grid view")).toBeVisible();
    expect(screen.getByLabelText("Select registry")).toBeVisible();
    expect(screen.getByPlaceholderText("Search")).toBeVisible();
  });

  it("displays servers in grid mode by default", () => {
    renderWithNuqs(
      <ServersWrapper servers={mockServers} registries={mockRegistries} />,
    );

    expect(screen.getByText("aws-nova-canvas")).toBeVisible();
    expect(screen.getByText("google-applications")).toBeVisible();
  });

  it("switches to list mode when list button is clicked", async () => {
    const user = userEvent.setup();
    renderWithNuqs(
      <ServersWrapper servers={mockServers} registries={mockRegistries} />,
    );

    await user.click(screen.getByLabelText("List view"));

    await waitFor(() => {
      expect(screen.getByText("Server")).toBeVisible();
      expect(screen.getByText("About")).toBeVisible();
      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
    });
  });

  it("switches back to grid mode when grid button is clicked", async () => {
    const user = userEvent.setup();
    renderWithNuqs(
      <ServersWrapper servers={mockServers} registries={mockRegistries} />,
    );

    await user.click(screen.getByLabelText("List view"));
    await user.click(screen.getByLabelText("Grid view"));

    await waitFor(() => {
      expect(screen.getByText("aws-nova-canvas")).toBeVisible();
      expect(screen.queryByText("Server")).not.toBeInTheDocument();
    });
  });

  it("updates search input when typing", async () => {
    const user = userEvent.setup();
    renderWithNuqs(
      <ServersWrapper servers={mockServers} registries={mockRegistries} />,
    );

    const searchInput = screen.getByPlaceholderText(
      "Search",
    ) as HTMLInputElement;
    await user.type(searchInput, "aws");

    // Search is server-side — the input value updates immediately (nuqs buffers URL updates)
    expect(searchInput.value).toBe("aws");
  });

  it("maintains search value when switching view modes", async () => {
    const user = userEvent.setup();
    renderWithNuqs(
      <ServersWrapper servers={mockServers} registries={mockRegistries} />,
    );

    const searchInput = screen.getByPlaceholderText(
      "Search",
    ) as HTMLInputElement;
    await user.type(searchInput, "aws");
    expect(searchInput.value).toBe("aws");

    await user.click(screen.getByLabelText("List view"));

    await waitFor(() => {
      expect(screen.getByText("Server")).toBeVisible();
    });

    expect(searchInput.value).toBe("aws");
  });

  it("renders pagination controls", () => {
    renderWithNuqs(
      <ServersWrapper servers={mockServers} registries={mockRegistries} />,
    );

    expect(screen.getByRole("button", { name: /previous/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /next/i })).toBeVisible();
    expect(screen.getByText("Items per page")).toBeVisible();
  });

  it("disables previous button on first page", () => {
    renderWithNuqs(
      <ServersWrapper servers={mockServers} registries={mockRegistries} />,
    );

    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("disables next button when there is no nextCursor", () => {
    renderWithNuqs(
      <ServersWrapper servers={mockServers} registries={mockRegistries} />,
    );

    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("enables next button when nextCursor is provided", () => {
    renderWithNuqs(
      <ServersWrapper
        servers={mockServers}
        registries={mockRegistries}
        nextCursor="cursor-abc"
      />,
    );

    expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
  });
});
