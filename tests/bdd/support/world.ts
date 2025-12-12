import { setWorldConstructor, type World } from "@cucumber/cucumber";
import type { BrowserContext, Page } from "@playwright/test";

export class PlaywrightWorld implements World {
  page: Page | undefined;
  context: BrowserContext | undefined;
  baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BASE_URL || "http://localhost:3000";
  }

  requirePage(): Page {
    if (!this.page)
      throw new Error("Page not initialized - Before hook may have failed");
    return this.page;
  }

  requireContext(): BrowserContext {
    if (!this.context)
      throw new Error("Context not initialized - Before hook may have failed");
    return this.context;
  }
}

setWorldConstructor(PlaywrightWorld);
