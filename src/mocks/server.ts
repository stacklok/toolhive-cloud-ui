import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "@mswjs/http-middleware";
import { handlers } from "./handlers";

// Fixed port for the standalone mock server
const port = 9090;

const httpServer = createServer(...handlers);

httpServer.on("request", (req: IncomingMessage, _res: ServerResponse) => {
  // biome-ignore lint: dev mock server request log
  console.log(`[mock] ${req.method} ${req.url}`);
});

httpServer.listen(port, () => {
  // biome-ignore lint: dev mock server startup log
  console.log(`MSW mock server running on http://localhost:${port}`);
});
