import { HttpResponse } from "msw";
import { mockScenario } from "../mockScenario";

/**
 * Empty servers scenario - returns an empty list of servers.
 * Activate by setting cookie: mock-scenario=empty-servers
 */
export const emptyServersHandlers = [
  mockScenario("empty-servers").get("*/registry/v0.1/servers", () => {
    return HttpResponse.json({
      servers: [],
      metadata: { count: 0 },
    });
  }),
];
