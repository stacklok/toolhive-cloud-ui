import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "@mswjs/http-middleware";
import { getApiBaseUrl } from "@/lib/env";
import { handlers } from "./handlers";

// Mock server runs on the port configured in API_BASE_URL
// This ensures the app can reach the mock server at the expected URL
const port = new URL(getApiBaseUrl()).port;

if (!port) {
  throw new Error("API_BASE_URL must include a port number");
}

const httpServer = createServer(...handlers);

httpServer.on("request", (req: IncomingMessage, _res: ServerResponse) => {
  // biome-ignore lint: dev mock server request log
  console.log(`[mock] ${req.method} ${req.url}`);
});

httpServer.listen(port, () => {
  // biome-ignore lint: dev mock server startup log
  console.log(`MSW mock server running on http://localhost:${port}`);
});
