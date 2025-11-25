import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "@mswjs/http-middleware";
import { config } from "dotenv";
import { HttpResponse, http } from "msw";
import { handlers } from "./handlers";

// Load .env first, then .env.local (which overrides .env)
config();
config({ path: ".env.local" });

// Mock server runs on the port configured in API_BASE_URL
// This ensures the app can reach the mock server at the expected URL
const apiBaseUrl = process.env.API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("API_BASE_URL environment variable is required");
}

const port = new URL(apiBaseUrl).port;

if (!port) {
  throw new Error("API_BASE_URL must include a port number");
}

// Add health check endpoint for CI readiness checks
const healthHandler = http.get("*/health", () => {
  return HttpResponse.json({ status: "ok" });
});

const httpServer = createServer(healthHandler, ...handlers);

httpServer.on("request", (req: IncomingMessage, _res: ServerResponse) => {
  console.log(`[mock] ${req.method} ${req.url}`);
});

httpServer.listen(port, () => {
  console.log(`MSW mock server running on http://localhost:${port}`);
});
