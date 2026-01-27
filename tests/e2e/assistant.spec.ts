import { expect, test } from "./fixtures";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const E2E_MODEL_NAME = process.env.E2E_MODEL_NAME ?? "qwen2.5:1.5b";

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
      prompt: "Say hello",
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
  // Triple all timeouts for this describe block since LLM operations are slow
  test.slow();

  // Warmup testing model before running any tests in this describe block
  test.beforeAll(async () => {
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

  test("responds to user message with expected content", async ({
    authenticatedPage,
  }) => {
    // Use a unique identifier that we expect to appear in the response
    const testUsername = `testuser_${Date.now()}`;

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

    // Type a message that includes the unique identifier
    const textarea = authenticatedPage.getByPlaceholder(/type your message/i);
    await textarea.fill(
      `Reply with a short greeting for the user named '${testUsername}'. Include their exact username in your response.`,
    );

    // Submit the message
    await authenticatedPage.keyboard.press("Enter");

    // Wait for the assistant's response to appear
    // The response should contain our unique username in a greeting
    // Using a generous timeout since model inference can take time
    // The regex matches any greeting pattern followed by the username
    await expect(
      authenticatedPage.getByText(
        new RegExp(`(hello|hi|hey|greetings).*${testUsername}`, "i"),
      ),
    ).toBeVisible({
      timeout: 60_000,
    });
  });

  test("displays streaming response", async ({ authenticatedPage }) => {
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
    await textarea.fill("Count from 1 to 5, one number per line.");

    await authenticatedPage.keyboard.press("Enter");

    // Wait for the assistant's response containing numbers
    // Look for sequential digits that only appear in the assistant's response
    // (not in "Count from 1 to 5" user message or "claude-sonnet-4.5" model name)
    await expect(
      authenticatedPage.getByText(/\b1\s+2\s+3\b/), // Sequential numbers separated by whitespace
    ).toBeVisible({
      timeout: 60_000,
    });
  });
});
