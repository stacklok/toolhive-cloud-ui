import type { RequestHandler } from "msw";
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...(handlers as RequestHandler[]));

type Recorded = {
  method: string;
  pathname: string;
  search: string;
  body?: unknown;
};

const recorded: Recorded[] = [];

// Attach simple request recorder
// Requires MSW v2+ events API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(server as any).events?.on("request:start", async ({ request }: any) => {
  try {
    const url = new URL(request.url);
    let body: unknown;
    try {
      body = await request.clone().json();
    } catch {
      // ignore non-JSON bodies
    }
    recorded.push({
      method: request.method,
      pathname: url.pathname,
      search: url.search,
      body,
    });
  } catch {
    // ignore
  }
});

export function recordRequests() {
  return recorded;
}

export function clearRecordedRequests() {
  recorded.length = 0;
}
