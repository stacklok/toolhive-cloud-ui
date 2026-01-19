import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unmock @/lib/auth/token to test the real implementation
vi.unmock("@/lib/auth/token");

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("cookie=value"),
  }),
}));

// Mock ./db module to set isDatabaseMode = false (cookie mode)
vi.mock("../db", () => ({
  isDatabaseMode: false,
  pool: null,
  getAccountForRefresh: vi.fn(),
  updateAccountTokens: vi.fn(),
}));

// Mock ./auth module
const mockGetOidcProviderAccessToken = vi.fn();

vi.mock("../auth", () => ({
  getOidcProviderAccessToken: (...args: unknown[]) =>
    mockGetOidcProviderAccessToken(...args),
  getOidcDiscovery: vi.fn(),
}));

// Import after mocks
const { getValidOidcToken } = await import("../token");

describe("token", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getValidOidcToken", () => {
    it("should return existing token if still valid", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue("valid-access-token");

      const token = await getValidOidcToken(userId);

      expect(token).toBe("valid-access-token");
      expect(mockGetOidcProviderAccessToken).toHaveBeenCalledWith(userId);
      // Should not attempt refresh
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("attempting refresh"),
      );
    });

    it("should return null in cookie mode (proxy handles refresh)", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue(null);

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
      // In cookie mode, refresh is handled by proxy.ts
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Token] Cookie mode - proxy should have refreshed token",
      );
    });
  });
});
