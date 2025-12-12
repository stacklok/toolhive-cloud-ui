import type { BrowserContext } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

/**
 * Logs in via OIDC flow in a temporary page, leaving auth cookies in the context.
 */
export async function injectAuthCookies(
  context: BrowserContext,
): Promise<void> {
  const page = await context.newPage();
  try {
    await page.goto(`${BASE_URL}/signin`);
    await page.getByRole("button", { name: "Okta" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/signin"), {
      timeout: 30000,
    });
  } finally {
    await page.close();
  }
}
