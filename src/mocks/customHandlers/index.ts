import type { RequestHandler } from "msw";

// Add non-schema, hand-written mocks here.
// These are composed before the auto-generated handlers (handlers.ts),
// so they can replace or extend behavior where needed.
export const customHandlers: RequestHandler[] = [
  // Example override: customize one endpoint's payload
  // http.get("*/registry/v0.1/servers", () =>
  //   HttpResponse.json({ servers: [], metadata: { count: 0 } }),
  // ),
];
