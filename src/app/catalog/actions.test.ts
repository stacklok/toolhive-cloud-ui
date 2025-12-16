import { mockedGetRegistryV01Servers } from "@mocks/fixtures/registry_v0_1_servers/get";
import { HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getServers } from "./actions";

// Authentication is mocked globally in vitest.setup.ts:
// - auth.api.getSession returns a mock session
// - getValidOidcToken returns "mock-test-token"

describe("getServers", () => {
  beforeEach(() => {
    // Suppress console.error in error scenario tests to keep output clean
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("returns servers from default fixture", async () => {
    const servers = await getServers();

    expect(servers.length).toBeGreaterThan(0);
    expect(servers[0].name).toBe("awslabs/aws-nova-canvas");
  });

  // Demo: using .activateScenario() for reusable test scenarios
  it("returns empty array when using empty-servers scenario", async () => {
    mockedGetRegistryV01Servers.activateScenario("empty-servers");

    const servers = await getServers();

    expect(servers).toEqual([]);
  });

  // Demo: using .activateScenario() for error scenarios
  it("throws on server error scenario", async () => {
    mockedGetRegistryV01Servers.activateScenario("server-error");

    await expect(getServers()).rejects.toBeDefined();
  });

  // Demo: using .override() for type-safe response modifications
  it("can override response data with type safety", async () => {
    mockedGetRegistryV01Servers.override(() => ({
      servers: [
        {
          server: {
            name: "test/server",
            title: "Test Server",
          },
        },
      ],
      metadata: { count: 1 },
    }));

    const servers = await getServers();

    expect(servers).toHaveLength(1);
    expect(servers[0].name).toBe("test/server");
  });

  // Demo: using .overrideHandler() for error status codes
  it("can use overrideHandler for custom error responses", async () => {
    mockedGetRegistryV01Servers.overrideHandler(() =>
      HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );

    await expect(getServers()).rejects.toBeDefined();
  });
});
