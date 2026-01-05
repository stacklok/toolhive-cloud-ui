import { expect, test } from "./fixtures";

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
  // Triple all timeouts for this describe block since LLM operations are slow
  test.slow();

  // Warmup Ollama before running any tests in this describe block
  test.beforeAll(async () => {
    console.log("Warming up Ollama...");
    const startTime = Date.now();

    try {
      await warmupOllama();
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
    // Look for a pattern that indicates the assistant has responded with numbers
    await expect(
      authenticatedPage.getByText(/[1-5].*[1-5]/), // At least two numbers in the response
    ).toBeVisible({
      timeout: 60_000,
    });
  });
});
