import { expect, test } from "./fixtures";

test.describe("Catalog page", () => {
  test("view catalog page header", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/catalog");
    await expect(
      authenticatedPage.getByRole("heading", { name: "MCP Server Catalog" }),
    ).toBeVisible();
  });
});
