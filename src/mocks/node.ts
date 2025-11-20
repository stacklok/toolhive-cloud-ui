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

// Attach simple request recorder (MSW v2 events API)
type ServerWithEvents = ReturnType<typeof setupServer> & {
  events?: {
    on: (
      event: "request:start",
      cb: (args: { request: Request }) => void,
    ) => void;
  };
};
const serverWithEvents: ServerWithEvents = server as ServerWithEvents;
serverWithEvents.events?.on("request:start", async ({ request }) => {
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
