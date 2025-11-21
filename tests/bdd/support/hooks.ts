import {
  After,
  Before,
  type ITestCaseHookParameter,
  setDefaultTimeout,
} from "@cucumber/cucumber";
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
} from "@playwright/test";
import type { PlaywrightWorld } from "./world";

let browser: Browser | undefined;
const TRACE_ENABLED = process.env.PWTRACE === "1";

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

  if (TRACE_ENABLED) {
    await this.context.tracing.start({ screenshots: true, snapshots: true });
  }

  if (isDebug) {
    await this.page.pause();
  }
});

After(async function (this: PlaywrightWorld, scenario: ITestCaseHookParameter) {
  if (TRACE_ENABLED && this.context) {
    const safeName = scenario.pickle.name.replace(/[^a-z0-9-]+/gi, "_");
    const { mkdir } = await import("node:fs/promises");
    await mkdir("test-results/traces", { recursive: true });
    await this.context.tracing.stop({
      path: `test-results/traces/${safeName}.zip`,
    });
  }
  if (this.page) await this.page.close();
  if (this.context) await this.context.close();
});
