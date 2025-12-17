import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, streamText } from "ai";

export const maxDuration = 60;

const MODEL = "anthropic/claude-sonnet-4";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response("OPENROUTER_API_KEY not configured", {
      status: 500,
    });
  }

  const provider = createOpenRouter({ apiKey });
  const model = provider(MODEL);

  const result = streamText({
    model,
    messages: convertToModelMessages(messages),
  });

  return result.toTextStreamResponse();
}
