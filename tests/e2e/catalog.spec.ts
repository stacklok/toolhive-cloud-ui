import { expect, test } from "./fixtures";

test.describe("Catalog page", () => {
  test("displays MCP servers from the catalog", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/catalog");

    await expect(
      authenticatedPage.getByRole("heading", { name: "MCP Server Catalog" }),
    ).toBeVisible();

    await expect(
      authenticatedPage.getByText("awslabs/aws-nova-canvas"),
    ).toBeVisible();
    await expect(
      authenticatedPage.getByText("github/mcp-github"),
    ).toBeVisible();
  });
});
