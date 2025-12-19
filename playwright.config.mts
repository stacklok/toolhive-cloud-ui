import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function isServerRunning(): Promise<boolean> {
  try {
    await fetch(BASE_URL, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

const serverAlreadyRunning = await isServerRunning();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: serverAlreadyRunning
    ? undefined
    : {
        command: "pnpm dev",
        url: BASE_URL,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          API_BASE_URL: "http://localhost:9090",
          OIDC_ISSUER_URL: "http://localhost:4000",
          OIDC_CLIENT_ID: "better-auth-dev",
          OIDC_CLIENT_SECRET: "dev-secret-change-in-production",
          NEXT_PUBLIC_OIDC_PROVIDER_ID: "okta",
          BETTER_AUTH_URL: "http://localhost:3000",
          BETTER_AUTH_SECRET: "e2e-test-secret-at-least-32-chars-long",
          // Pass Ollama config to the dev server if set
          ...(process.env.USE_OLLAMA && {
            USE_OLLAMA: process.env.USE_OLLAMA,
            OLLAMA_MODEL: process.env.OLLAMA_MODEL,
            OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
          }),
        },
      },
});
