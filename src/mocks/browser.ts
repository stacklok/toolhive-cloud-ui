import type { RequestHandler } from "msw";
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...(handlers as RequestHandler[]));

export async function startWorker() {
  await worker.start({ onUnhandledRequest: "bypass" });
}
