import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "@mswjs/http-middleware";
import { handlers } from "./handlers";

// Fixed port for the standalone mock server
const port = 9090;

const httpServer = createServer(...handlers);

httpServer.on("request", (req: IncomingMessage, _res: ServerResponse) => {
  // eslint-disable-next-line no-console
  console.log(`[mock] ${req.method} ${req.url}`);
});

httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`MSW mock server running on http://localhost:${port}`);
});
