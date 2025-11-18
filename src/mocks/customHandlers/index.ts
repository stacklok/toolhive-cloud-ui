import type { RequestHandler } from "msw";

// Add non-schema, hand-written mocks here.
// These take precedence over the schema-based mocks.
export const customHandlers: RequestHandler[] = [
  // Example override: customize one endpoint's payload
  // http.get("*/registry/v0.1/servers", () =>
  //   HttpResponse.json({ servers: [], metadata: { count: 0 } }),
  // ),
];
