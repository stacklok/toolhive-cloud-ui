import type { RequestHandler } from "msw";

// Add hand-written handlers here. These take precedence over
// auto-generated ones because they are spread first in handlers.ts.
export const customHandlers: RequestHandler[] = [
  // Example override: customize one endpoint's payload
  // http.get("*/registry/v0.1/servers", () =>
  //   HttpResponse.json({ servers: [], metadata: { count: 0 } }),
  // ),
];
