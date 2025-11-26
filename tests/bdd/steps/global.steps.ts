import { Given, Then, When } from "@cucumber/cucumber";
import { type AriaRole, expect } from "@playwright/test";
import { injectAuthCookies } from "../support/auth.ts";
import type { PlaywrightWorld } from "../support/world";

Given("I am on {string}", async function (this: PlaywrightWorld, path: string) {
  await this.requirePage().goto(`${this.baseUrl}${path}`);
});

Given("I am logged in", async function (this: PlaywrightWorld) {
  await injectAuthCookies(this.requireContext());
});

When(
  "I click on the {string} {role}",
  async function (this: PlaywrightWorld, label: string, role: AriaRole) {
    await this.requirePage().getByRole(role, { name: label }).click();
  },
);

Then(
  "I should see {article} {string} heading",
  async function (this: PlaywrightWorld, _article: null, heading: string) {
    await expect(
      this.requirePage().getByRole("heading", { name: heading }),
    ).toBeVisible();
  },
);

Then(
  "I should be on {string}",
  async function (this: PlaywrightWorld, path: string) {
    await expect(this.requirePage()).toHaveURL(
      new RegExp(
        `${this.baseUrl}${path.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`,
      ),
    );
  },
);
