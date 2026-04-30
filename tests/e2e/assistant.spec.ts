import { expect, test } from "./fixtures";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const E2E_MODEL_NAME = process.env.E2E_MODEL_NAME ?? "qwen3:1.7b";

/**
 * Warms up the testing model (Ollama) by making a simple generation request.
 * This ensures the model is loaded into memory before running tests.
 */
async function warmupTestingModel(): Promise<void> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: E2E_MODEL_NAME,
      prompt: "What is 1 + 1?",
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `E2E model warmup failed: ${response.status} ${response.statusText}`,
    );
  }

  const result = await response.json();
  console.log(`E2E model warmup complete. Model: ${E2E_MODEL_NAME}`);
  console.log(`Warmup response: ${result.response?.substring(0, 50)}...`);
}

test.describe("Assistant chat", () => {
  // Run tests serially to avoid race conditions with route compilation
  // Triple all timeouts for this describe block since LLM operations are slow
  test.slow();

  // Warmup testing model before running any tests in this describe block.
  // qwen3 with thinking mode needs >30s for first inference on CI runners,
  // so we set a generous timeout (120s) for model loading + first generation.
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires destructured first arg to access testInfo
  test.beforeAll(async ({}, testInfo) => {
    testInfo.setTimeout(120_000);
    console.log("Warming up E2E testing model...");
    const startTime = Date.now();

    try {
      await warmupTestingModel();
      console.log(`E2E model warmup took ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error("E2E model warmup failed:", error);
      throw error;
    }
  });

  test("responds to a simple arithmetic question", async ({
    authenticatedPage,
  }) => {
    // Navigate to catalog page which has the assistant sidebar
    await authenticatedPage.goto("/catalog");

    // Open the assistant sidebar
    await authenticatedPage
      .getByRole("button", { name: "Toggle Assistant" })
      .click();

    // Wait for the sidebar to open and chat input to be visible
    await expect(
      authenticatedPage.getByPlaceholder(/type your message/i),
    ).toBeVisible({ timeout: 10_000 });

    const textarea = authenticatedPage.getByPlaceholder(/type your message/i);
    await textarea.fill("What is 1 + 1? Reply with just the number.");

    await authenticatedPage.keyboard.press("Enter");

    // Wait for the assistant's response containing "2".
    // Any LLM will answer basic arithmetic correctly regardless of model,
    // thinking mode, or output format. The regex avoids false-positives from
    // the user message ("1 + 1") by matching a standalone "2".
    await expect(authenticatedPage.getByText(/\b2\b/)).toBeVisible({
      timeout: 60_000,
    });
  });
});
