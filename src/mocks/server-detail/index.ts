import type { RequestHandler } from "msw";
import { HttpResponse, http } from "msw";
import serversListFixture from "../fixtures/registry_v0_1_servers/get";

// Add non-schema, hand-written mocks here.
// These take precedence over the schema-based mocks.
export const serverDetailHandlers: RequestHandler[] = [
  // Mock for server detail endpoint - returns server from list with normalized version
  http.get(
    "*/registry/v0.1/servers/:serverName/versions/:version",
    ({ params }) => {
      // MSW already decodes the path parameters
      const serverName = String(params.serverName);
      const version = String(params.version);

      console.log("[Server detail mock] Received:", {
        serverName,
        version,
      });

      // Find matching server from the list
      const serverResponse = serversListFixture.servers?.find((item) => {
        const nameMatch = item.server?.name === serverName;
        const versionMatch =
          item.server?.version === version || version === "latest";

        return nameMatch && versionMatch;
      });

      if (!serverResponse?.server) {
        console.log(`[custom-mock] Server not found: ${serverName}@${version}`);
        console.log(
          "Available servers:",
          serversListFixture.servers?.map(
            (s) => `${s.server?.name}@${s.server?.version}`,
          ),
        );
        return new HttpResponse(null, { status: 404 });
      }

      const response = {
        server: serverResponse.server,
        _meta: serverResponse._meta,
      };

      return HttpResponse.json(response);
    },
  ),
];
