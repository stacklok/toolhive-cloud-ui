import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ServerTool } from "@/lib/schemas/server-meta";
import { ServerDetailTabs } from "../server-detail-tabs";

const tools: ServerTool[] = [
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
];

describe("ServerDetailTabs", () => {
  it("shows About tab content by default", () => {
    render(
      <ServerDetailTabs tools={tools}>
        <p>About content</p>
      </ServerDetailTabs>,
    );

    expect(screen.getByText("About content")).toBeVisible();
  });

  it("renders About and Tools tab triggers", () => {
    render(
      <ServerDetailTabs tools={tools}>
        <p>About content</p>
      </ServerDetailTabs>,
    );

    expect(screen.getByRole("tab", { name: "About" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Tools" })).toBeVisible();
  });

  it("switches to Tools tab and shows tools table", async () => {
    const user = userEvent.setup();

    render(
      <ServerDetailTabs tools={tools}>
        <p>About content</p>
      </ServerDetailTabs>,
    );

    await user.click(screen.getByRole("tab", { name: "Tools" }));

    expect(screen.getByText("get_vulnerability")).toBeVisible();
    expect(screen.getByText("query_vulnerabilities_batch")).toBeVisible();
    expect(screen.getByText("query_vulnerability")).toBeVisible();
    expect(
      screen.getByText("Get details for a specific vulnerability by ID"),
    ).toBeVisible();
  });

  it("shows empty state when tools array is empty", async () => {
    const user = userEvent.setup();

    render(
      <ServerDetailTabs tools={[]}>
        <p>About content</p>
      </ServerDetailTabs>,
    );

    await user.click(screen.getByRole("tab", { name: "Tools" }));

    expect(screen.getByText("No tools available")).toBeVisible();
  });

  it("shows 'No description' for tools without description", async () => {
    const user = userEvent.setup();
    const toolsWithoutDesc: ServerTool[] = [{ name: "my_tool" }];

    render(
      <ServerDetailTabs tools={toolsWithoutDesc}>
        <p>About content</p>
      </ServerDetailTabs>,
    );

    await user.click(screen.getByRole("tab", { name: "Tools" }));

    expect(screen.getByText("my_tool")).toBeVisible();
    expect(screen.getByText("No description")).toBeVisible();
  });

  it("renders table headers Tools and Description", async () => {
    const user = userEvent.setup();

    render(
      <ServerDetailTabs tools={tools}>
        <p>About content</p>
      </ServerDetailTabs>,
    );

    await user.click(screen.getByRole("tab", { name: "Tools" }));

    expect(screen.getByRole("columnheader", { name: "Tools" })).toBeVisible();
    expect(
      screen.getByRole("columnheader", { name: "Description" }),
    ).toBeVisible();
  });
});
