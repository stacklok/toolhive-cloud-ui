import { test as base, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function login(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/signin`);
  // Wait for JS to fully load and hydrate before interacting
  await page.waitForLoadState("networkidle");

  const signInButton = page.getByRole("button", { name: /oidc|okta/i });
  await expect(signInButton).toBeVisible({ timeout: 5000 });
  await signInButton.click();

  await page.waitForURL((url) => !url.pathname.startsWith("/signin"), {
    timeout: 30000,
  });
}

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await login(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
