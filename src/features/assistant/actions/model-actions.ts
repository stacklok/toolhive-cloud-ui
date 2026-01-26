"use server";

import { OpenRouter } from "@openrouter/sdk";

/**
 * Fallback models for when OpenRouter API is unavailable.
 * These are known tool-capable models.
 */
const FALLBACK_OPENROUTER_MODELS = [
  // Anthropic models
  "anthropic/claude-sonnet-4.5",
  "anthropic/claude-opus-4",
  "anthropic/claude-3.5-sonnet:beta",
  "anthropic/claude-3-5-sonnet-20241022",
  "anthropic/claude-3-5-haiku-20241022",
  "anthropic/claude-3-opus-20240229",

  // OpenAI models
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "openai/gpt-4.1",
  "openai/gpt-4.1-mini",
  "openai/o3",
  "openai/o3-mini",

  // Google models
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "google/gemini-2.0-flash",

  // Meta (Llama) models
  "meta-llama/llama-3.3-70b-instruct",

  // DeepSeek models
  "deepseek/deepseek-r1-0528",
  "deepseek/deepseek-v3-0324",

  // Qwen models
  "qwen/qwen3-235b",
  "qwen/qwen3-32b",
] as const;

/**
 * Create OpenRouter SDK client instance with explicit API key.
 * The SDK reads from OPENROUTER_API_KEY env var, but we make it explicit for clarity.
 */
function createOpenRouterClient(): OpenRouter {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set", {
      cause: { missingOpenRouterApiKey: true },
    });
  }
  return new OpenRouter({ apiKey });
}

/**
 * Checks if a model ID represents a non-chat model (embeddings, audio, etc.)
 */
function isNonChatModel(modelId: string): boolean {
  const id = modelId.toLowerCase();
  return (
    id.includes("embedding") ||
    id.includes("whisper") ||
    id.includes("tts") ||
    id.includes("dall-e") ||
    id.includes("moderation") ||
    id.includes("audio") ||
    id.includes("image")
  );
}

/**
 * Checks if a model supports tool/function calling
 */
function supportsTools(supportedParameters: string[]): boolean {
  return (
    supportedParameters.includes("tools") ||
    supportedParameters.includes("tool_choice")
  );
}

/**
 * Fetches available OpenRouter models that support tool/function calling.
 * Uses the official OpenRouter SDK.
 * Falls back to a hardcoded list if the API is unavailable.
 * In E2E test mode, returns a testing model to bypass OpenRouter requirement.
 */
export async function getOpenRouterModels(): Promise<string[]> {
  // In E2E test mode, return a testing model to bypass OpenRouter requirement
  const useTestingModel = process.env.USE_E2E_MODEL === "true";

  const testModel = process.env.E2E_MODEL_NAME;
  if (useTestingModel && testModel) {
    return [testModel];
  }

  try {
    const client = createOpenRouterClient();
    const response = await client.models.list();

    // Filter models to only include those suitable for chat with tool support
    const models = response.data
      .filter((model) => {
        // Exclude non-chat models
        if (isNonChatModel(model.id)) return false;

        // Only include models that support tools/function calling
        return supportsTools(model.supportedParameters);
      })
      .map((model) => model.id);

    return models;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.cause as { missingOpenRouterApiKey?: boolean })
        ?.missingOpenRouterApiKey
    ) {
      console.error("No OpenRouter API key found");
      return [];
    }
    console.error("Error fetching OpenRouter models:", error);
    return [...FALLBACK_OPENROUTER_MODELS];
  }
}
