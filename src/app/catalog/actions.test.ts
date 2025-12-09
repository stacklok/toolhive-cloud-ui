import { mockedGetRegistryV01Servers } from "@mocks/fixtures/registry_v0_1_servers/get";
import { HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServers } from "./actions";

// Mock the auth to bypass authentication
vi.mock("@/lib/api-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...original,
    getAuthenticatedClient: vi.fn(() =>
      original.getAuthenticatedClient("mock-token"),
    ),
  };
});

describe("getServers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful responses", () => {
    it("returns servers from default fixture", async () => {
      const servers = await getServers();

      expect(servers.length).toBeGreaterThan(0);
      expect(servers[0].name).toBe("awslabs/aws-nova-canvas");
      expect(servers[0].title).toBe("AWS Nova Canvas");
    });

    it("returns empty array when API returns no servers", async () => {
      mockedGetRegistryV01Servers.override(() =>
        HttpResponse.json({ servers: [], metadata: { count: 0 } }),
      );

      const servers = await getServers();

      expect(servers).toEqual([]);
    });

    it("returns empty array when API returns null data", async () => {
      mockedGetRegistryV01Servers.override(() => HttpResponse.json(null));

      const servers = await getServers();

      expect(servers).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("throws on 500 server error", async () => {
      mockedGetRegistryV01Servers.override(() =>
        HttpResponse.json({ error: "Internal Server Error" }, { status: 500 }),
      );

      await expect(getServers()).rejects.toBeDefined();
    });

    it("throws on 401 unauthorized", async () => {
      mockedGetRegistryV01Servers.override(() =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );

      await expect(getServers()).rejects.toBeDefined();
    });

    it("throws on network error", async () => {
      mockedGetRegistryV01Servers.override(() => HttpResponse.error());

      await expect(getServers()).rejects.toBeDefined();
    });
  });

  describe("data transformation", () => {
    it("filters out null servers from response", async () => {
      mockedGetRegistryV01Servers.override((data) =>
        HttpResponse.json({
          ...data,
          servers: [
            { server: { name: "valid/server", title: "Valid" } },
            { server: null },
            { server: { name: "another/server", title: "Another" } },
          ],
          metadata: { count: 3 },
        }),
      );

      const servers = await getServers();

      expect(servers).toHaveLength(2);
      expect(servers.map((s) => s.name)).toEqual([
        "valid/server",
        "another/server",
      ]);
    });

    it("filters out undefined servers from response", async () => {
      mockedGetRegistryV01Servers.override(() =>
        HttpResponse.json({
          servers: [
            { server: { name: "valid/server", title: "Valid" } },
            { server: undefined },
            {},
          ],
          metadata: { count: 3 },
        }),
      );

      const servers = await getServers();

      expect(servers).toHaveLength(1);
      expect(servers[0].name).toBe("valid/server");
    });

    it("extracts server objects from nested response structure", async () => {
      mockedGetRegistryV01Servers.override(() =>
        HttpResponse.json({
          servers: [
            {
              server: {
                name: "test/server",
                title: "Test Server",
                description: "A test server",
                version: "2.0.0",
              },
              _meta: { "some/key": { status: "active" } },
            },
          ],
          metadata: { count: 1 },
        }),
      );

      const servers = await getServers();

      expect(servers).toHaveLength(1);
      expect(servers[0]).toEqual({
        name: "test/server",
        title: "Test Server",
        description: "A test server",
        version: "2.0.0",
      });
    });
  });

  describe("using default data in overrides", () => {
    it("can modify specific server titles", async () => {
      mockedGetRegistryV01Servers.override((data) =>
        HttpResponse.json({
          ...data,
          servers: data.servers?.map((item) => ({
            ...item,
            server: {
              ...item.server,
              title: `Modified: ${item.server?.title}`,
            },
          })),
        }),
      );

      const servers = await getServers();

      expect(servers[0].title).toBe("Modified: AWS Nova Canvas");
    });

    it("can limit the number of returned servers", async () => {
      mockedGetRegistryV01Servers.override((data) =>
        HttpResponse.json({
          ...data,
          servers: data.servers?.slice(0, 3),
          metadata: { count: 3 },
        }),
      );

      const servers = await getServers();

      expect(servers).toHaveLength(3);
    });

    it("can filter servers by criteria", async () => {
      mockedGetRegistryV01Servers.override((data) =>
        HttpResponse.json({
          ...data,
          servers: data.servers?.filter((item) =>
            item.server?.name?.includes("google"),
          ),
        }),
      );

      const servers = await getServers();

      expect(servers.every((s) => s.name?.includes("google"))).toBe(true);
    });
  });

  describe("request-aware overrides", () => {
    it("can access request info in override", async () => {
      let capturedUrl: string | undefined;

      mockedGetRegistryV01Servers.override((data, info) => {
        capturedUrl = info.request.url;
        return HttpResponse.json(data);
      });

      await getServers();

      expect(capturedUrl).toContain("/registry/v0.1/servers");
    });

    it("can vary response based on request headers", async () => {
      mockedGetRegistryV01Servers.override((data, info) => {
        const authHeader = info.request.headers.get("Authorization");
        if (authHeader?.includes("mock-token")) {
          return HttpResponse.json(data);
        }
        return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
      });

      // Our mock provides "mock-token", so this should succeed
      const servers = await getServers();
      expect(servers.length).toBeGreaterThan(0);
    });
  });
});
