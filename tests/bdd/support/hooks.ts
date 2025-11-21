import { After, Before, setDefaultTimeout } from "@cucumber/cucumber";
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
} from "@playwright/test";
import type { PlaywrightWorld } from "./world";

let browser: Browser | undefined;

setDefaultTimeout(60 * 1000); // 60s per step

Before(async function (this: PlaywrightWorld) {
  const isDebug = !!process.env.PWDEBUG;
  if (!browser) {
    browser = await chromium.launch({
      headless: !isDebug,
      slowMo: isDebug ? 100 : 0,
    });
  }
  const context: BrowserContext = await browser.newContext();
  const page: Page = await context.newPage();
  this.context = context;
  this.page = page;

  if (isDebug) {
    await this.page.pause();
  }
});

After(async function (this: PlaywrightWorld) {
  if (this.page) await this.page.close();
  if (this.context) await this.context.close();
});
