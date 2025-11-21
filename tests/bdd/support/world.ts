import { setWorldConstructor, type World } from "@cucumber/cucumber";
import type { BrowserContext, Page } from "@playwright/test";

export class PlaywrightWorld implements World {
  page!: Page;
  context!: BrowserContext;
  baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BASE_URL || "http://localhost:3000";
  }
}

setWorldConstructor(PlaywrightWorld);
