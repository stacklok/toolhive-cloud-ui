import { createServer } from "@mswjs/http-middleware";
import { handlers } from "./handlers";

const DEFAULT_PORT = 9090;
const port = Number(process.env.MOCK_PORT || DEFAULT_PORT);

const httpServer = createServer(...handlers);

httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`MSW mock server running on http://localhost:${port}`);
});
