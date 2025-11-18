import type { RequestHandler } from "msw";
import { HttpResponse, http } from "msw";

// Add hand-written handlers here. These take precedence over
// auto-generated ones because they are spread first in handlers.ts.
export const customHandlers: RequestHandler[] = [
  // Example override: customize one endpoint's payload
  // http.get("*/api/v0/registry/info", () =>
  //   HttpResponse.json({ custom: true }),
  // ),

  // Example health endpoint used in local dev
  http.get("*/health", () => HttpResponse.json({ ok: true })),
];
