import { expect, test } from "./fixtures";

test.describe("Login flow", () => {
  test("sign in and land on Catalog", async ({ page }) => {
    await page.goto("/signin");
    await page.waitForLoadState("networkidle");
    const signInButton = page.getByRole("button", { name: /oidc|okta/i });
    await expect(signInButton).toBeVisible({ timeout: 5000 });
    await signInButton.click();
    // Wait for redirect away from signin (same as authenticatedPage fixture)
    await page.waitForURL((url) => !url.pathname.startsWith("/signin"), {
      timeout: 30000,
    });
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
