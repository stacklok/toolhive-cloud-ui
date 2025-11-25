import type { BrowserContext } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

/**
 * Performs programmatic login by navigating through the OIDC flow
 * in an isolated context, then extracts and injects the cookies.
 *
 * This is faster than UI-based login for tests that need auth
 * but aren't testing the login flow itself.
 */
export async function injectAuthCookies(
  context: BrowserContext,
): Promise<void> {
  // Create a temporary page to perform login
  const page = await context.newPage();

  try {
    // Navigate to signin and click the Okta button
    await page.goto(`${BASE_URL}/signin`);
    await page.getByRole("button", { name: "Okta" }).click();

    // Wait for auth to complete (redirects away from signin)
    await page.waitForURL((url) => !url.pathname.startsWith("/signin"), {
      timeout: 30000,
    });

    // Cookies are now set in the context - they'll persist for other pages
  } finally {
    await page.close();
  }
}
