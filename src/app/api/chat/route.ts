import { createAnthropic } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText } from "ai";

export const maxDuration = 60;

const MODEL = "claude-sonnet-4-20250514";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY not configured", {
      status: 500,
    });
  }

  const anthropic = createAnthropic({ apiKey });
  const model = anthropic(MODEL);

  const result = streamText({
    model,
    messages: convertToModelMessages(messages),
  });

  return result.toTextStreamResponse();
}
