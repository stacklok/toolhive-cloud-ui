import { expect, test } from "./fixtures";

test.describe("Login flow", () => {
  test("sign in and land on Catalog", async ({ page }) => {
    await page.goto("/signin");
    await page.getByRole("button", { name: /oidc|okta/i }).click();
    await expect(page).toHaveURL(/\/catalog$/);
    await expect(
      page.getByRole("heading", { name: "MCP Server Catalog" }),
    ).toBeVisible();
  });

  test("log out from Catalog", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/catalog");
    await authenticatedPage.getByRole("button", { name: "Test User" }).click();
    await authenticatedPage.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(authenticatedPage).toHaveURL(/\/signin$/);
  });
});
