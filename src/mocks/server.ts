import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "@mswjs/http-middleware";
import { handlers } from "./handlers";

const DEFAULT_PORT = 9090;
const port = Number(process.env.MOCK_PORT || DEFAULT_PORT);

const httpServer = createServer(...handlers);

httpServer.on("request", (req: IncomingMessage, _res: ServerResponse) => {
  // eslint-disable-next-line no-console
  console.log(`[mock] ${req.method} ${req.url}`);
});

httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`MSW mock server running on http://localhost:${port}`);
});
