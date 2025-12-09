import { beforeEach, describe, expect, it, vi } from "vitest";
import { getServerDetails } from "./actions";

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

describe("getServerDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("successful responses", () => {
    it("returns server data for valid server name and version", async () => {
      const result = await getServerDetails("awslabs/aws-nova-canvas", "1.0.0");

      expect(result.error).toBeUndefined();
      expect(result.data?.server?.name).toBe("awslabs/aws-nova-canvas");
      expect(result.data?.server?.title).toBe("AWS Nova Canvas");
    });

    it("returns server data when version is 'latest'", async () => {
      const result = await getServerDetails(
        "awslabs/aws-nova-canvas",
        "latest",
      );

      expect(result.error).toBeUndefined();
      expect(result.data?.server?.name).toBe("awslabs/aws-nova-canvas");
    });

    it("returns different servers from fixture", async () => {
      const result = await getServerDetails("google/mcp-google-apps", "1.0.0");

      expect(result.error).toBeUndefined();
      expect(result.data?.server?.name).toBe("google/mcp-google-apps");
      expect(result.data?.server?.title).toBe("Google Workspace");
    });
  });

  describe("error handling", () => {
    it("returns 404 for non-existent server", async () => {
      const result = await getServerDetails("non-existent/server", "1.0.0");

      expect(result.response.status).toBe(404);
    });

    it("returns 404 for wrong version", async () => {
      const result = await getServerDetails("awslabs/aws-nova-canvas", "9.9.9");

      expect(result.response.status).toBe(404);
    });
  });

  describe("fixture data", () => {
    it("includes metadata in response", async () => {
      const result = await getServerDetails("awslabs/aws-nova-canvas", "1.0.0");

      expect(result.data?._meta).toBeDefined();
    });

    it("returns full server details from fixture", async () => {
      const result = await getServerDetails("awslabs/aws-nova-canvas", "1.0.0");

      expect(result.data?.server?.name).toBe("awslabs/aws-nova-canvas");
      expect(result.data?.server?.version).toBe("1.0.0");
      expect(result.data?.server?.description).toContain("MCP server");
    });
  });
});
