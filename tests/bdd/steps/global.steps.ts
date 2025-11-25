import { Given, Then, When } from "@cucumber/cucumber";
import { type AriaRole, expect } from "@playwright/test";
import type { PlaywrightWorld } from "../support/world";

Given("I am on {string}", async function (this: PlaywrightWorld, path: string) {
  await this.page.goto(`${this.baseUrl}${path}`);
});

Given("I am logged in", async function (this: PlaywrightWorld) {
  await this.page.goto(`${this.baseUrl}/signin`);
  await this.page.getByRole("button", { name: "Okta" }).click();
  // Wait for auth to complete (redirects away from signin)
  await this.page.waitForURL((url) => !url.pathname.startsWith("/signin"));
});

// Generic click step using the {role} parameter type (canonical phrases only)
When(
  "I click on the {string} {role}",
  async function (this: PlaywrightWorld, label: string, role: AriaRole) {
    await this.page.getByRole(role, { name: label }).click();
  },
);

// Intentionally avoid per-role variants (e.g., button) to keep steps DRY and consistent.

Then(
  "I should see the text {string}",
  async function (this: PlaywrightWorld, text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  },
);

Then(
  "I should see a heading {string}",
  async function (this: PlaywrightWorld, heading: string) {
    await expect(
      this.page.getByRole("heading", { name: heading }),
    ).toBeVisible();
  },
);

Then(
  "I should be on {string}",
  async function (this: PlaywrightWorld, path: string) {
    await expect(this.page).toHaveURL(
      new RegExp(
        `${this.baseUrl}${path.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`,
      ),
    );
  },
);
