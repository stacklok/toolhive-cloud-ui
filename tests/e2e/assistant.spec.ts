import { expect, test } from "./fixtures";

const USE_OLLAMA = process.env.USE_OLLAMA === "true";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:1.5b";

/**
 * Warms up Ollama by making a simple generation request.
 * This ensures the model is loaded into memory before running tests.
 */
async function warmupOllama(): Promise<void> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: "Say hello",
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama warmup failed: ${response.status} ${response.statusText}`,
    );
  }

  const result = await response.json();
  console.log(`Ollama warmup complete. Model: ${OLLAMA_MODEL}`);
  console.log(`Warmup response: ${result.response?.substring(0, 50)}...`);
}

test.describe("Assistant chat", () => {
  // Skip all tests in this describe block if not using Ollama
  test.skip(!USE_OLLAMA, "Skipping assistant tests - USE_OLLAMA not set");

  // Warmup Ollama before running any tests in this describe block
  // This has an extended timeout since model loading can take 30-60 seconds
  test.beforeAll(async () => {
    if (!USE_OLLAMA) return;

    console.log("Warming up Ollama...");
    const startTime = Date.now();

    // Set a generous timeout for warmup (2 minutes)
    // This is isolated from the individual test timeouts
    const warmupTimeout = 120_000;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () =>
          reject(new Error(`Ollama warmup timed out after ${warmupTimeout}ms`)),
        warmupTimeout,
      );
    });

    try {
      await Promise.race([warmupOllama(), timeoutPromise]);
      console.log(`Ollama warmup took ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error("Ollama warmup failed:", error);
      throw error;
    }
  });

  test("responds to user message with expected content", async ({
    authenticatedPage,
  }) => {
    // Use a unique identifier that we expect to appear in the response
    const testUsername = `testuser_${Date.now()}`;

    await authenticatedPage.goto("/assistant");

    // Wait for the page to load
    await expect(
      authenticatedPage.getByPlaceholder(/type your message/i),
    ).toBeVisible({ timeout: 10_000 });

    // Type a message that includes the unique identifier
    const textarea = authenticatedPage.getByPlaceholder(/type your message/i);
    await textarea.fill(
      `Reply with a short greeting for the user named '${testUsername}'. Include their exact username in your response.`,
    );

    // Submit the message
    await authenticatedPage.keyboard.press("Enter");

    // Wait for the assistant's response to appear
    // The response should contain our unique username
    // Using a generous timeout since model inference can take time
    // Use .first() since the username appears in both user message and assistant response
    await expect(
      authenticatedPage.getByText(new RegExp(`Hello.*${testUsername}`, "i")),
    ).toBeVisible({
      timeout: 60_000,
    });
  });

  test("displays streaming response", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/assistant");

    await expect(
      authenticatedPage.getByPlaceholder(/type your message/i),
    ).toBeVisible({ timeout: 10_000 });

    const textarea = authenticatedPage.getByPlaceholder(/type your message/i);
    await textarea.fill("Count from 1 to 5, one number per line.");

    await authenticatedPage.keyboard.press("Enter");

    // Wait for the assistant's response containing numbers
    // Look for a pattern that indicates the assistant has responded with numbers
    await expect(
      authenticatedPage.getByText(/[1-5].*[1-5]/), // At least two numbers in the response
    ).toBeVisible({
      timeout: 60_000,
    });
  });
});
