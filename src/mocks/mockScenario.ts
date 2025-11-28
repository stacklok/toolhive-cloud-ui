import { type HttpHandler, http } from "msw";

type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "head"
  | "options";

const SCENARIO_HEADER = "x-mock-scenario";

/**
 * Creates scenario-specific mock handlers that only activate when the X-Mock-Scenario header matches.
 * The header is set by the API client based on the "mock-scenario" cookie.
 */
export function mockScenario(
  scenario: string,
): Record<HttpMethod, typeof http.get> {
  return new Proxy({} as Record<HttpMethod, typeof http.get>, {
    get(_, method: HttpMethod) {
      const httpMethod = http[method];
      if (typeof httpMethod !== "function") return undefined;

      return (
        path: string,
        handler: Parameters<typeof httpMethod>[1],
      ): HttpHandler =>
        httpMethod(path, (info) => {
          const headerValue = info.request.headers.get(SCENARIO_HEADER);

          if (headerValue !== scenario) {
            return;
          }
          return handler(info);
        });
    },
  });
}
