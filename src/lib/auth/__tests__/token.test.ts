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
const mockGetOidcDiscovery = vi.fn();

vi.mock("../auth", () => ({
  getOidcProviderAccessToken: (...args: unknown[]) =>
    mockGetOidcProviderAccessToken(...args),
  getOidcDiscovery: (...args: unknown[]) => mockGetOidcDiscovery(...args),
}));

// Import after mocks
const {
  getValidOidcToken,
  needsRefresh,
  refreshTokenWithProvider,
  TOKEN_REFRESH_THRESHOLD_MS,
} = await import("../token");

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

  describe("needsRefresh", () => {
    it("should return true when token is expired", () => {
      const tokenData = {
        accessToken: "test-token",
        accessTokenExpiresAt: Date.now() - 1000, // Expired 1 second ago
        userId: "user-123",
      };

      expect(needsRefresh(tokenData)).toBe(true);
    });

    it("should return true when token expires within threshold", () => {
      const tokenData = {
        accessToken: "test-token",
        // Expires in 2 minutes (within 5 min threshold)
        accessTokenExpiresAt: Date.now() + 2 * 60 * 1000,
        userId: "user-123",
      };

      expect(needsRefresh(tokenData)).toBe(true);
    });

    it("should return false when token is still valid", () => {
      const tokenData = {
        accessToken: "test-token",
        // Expires in 10 minutes (outside 5 min threshold)
        accessTokenExpiresAt: Date.now() + 10 * 60 * 1000,
        userId: "user-123",
      };

      expect(needsRefresh(tokenData)).toBe(false);
    });

    it("should return true when token expires exactly at threshold", () => {
      const tokenData = {
        accessToken: "test-token",
        accessTokenExpiresAt: Date.now() + TOKEN_REFRESH_THRESHOLD_MS,
        userId: "user-123",
      };

      expect(needsRefresh(tokenData)).toBe(true);
    });
  });

  describe("refreshTokenWithProvider", () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("should return null when no refresh token", async () => {
      const tokenData = {
        accessToken: "test-token",
        accessTokenExpiresAt: Date.now() - 1000,
        userId: "user-123",
        // No refreshToken
      };

      const result = await refreshTokenWithProvider(tokenData);

      expect(result).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Token] No refresh token available",
      );
    });

    it("should return null when refresh token is expired", async () => {
      const tokenData = {
        accessToken: "test-token",
        accessTokenExpiresAt: Date.now() - 1000,
        userId: "user-123",
        refreshToken: "refresh-token",
        refreshTokenExpiresAt: Date.now() - 1000, // Expired
      };

      const result = await refreshTokenWithProvider(tokenData);

      expect(result).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Token] Refresh token expired",
      );
    });

    it("should return null when discovery fails", async () => {
      const tokenData = {
        accessToken: "test-token",
        accessTokenExpiresAt: Date.now() - 1000,
        userId: "user-123",
        refreshToken: "refresh-token",
      };

      mockGetOidcDiscovery.mockResolvedValue(null);

      const result = await refreshTokenWithProvider(tokenData);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Token] Token endpoint not available",
      );
    });

    it("should return null when token endpoint returns error", async () => {
      const tokenData = {
        accessToken: "test-token",
        accessTokenExpiresAt: Date.now() - 1000,
        userId: "user-123",
        refreshToken: "refresh-token",
      };

      mockGetOidcDiscovery.mockResolvedValue({
        tokenEndpoint: "https://oidc.example.com/token",
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await refreshTokenWithProvider(tokenData);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Token] Refresh failed:",
        401,
      );
    });

    it("should return new token data on successful refresh", async () => {
      const tokenData = {
        accessToken: "old-token",
        accessTokenExpiresAt: Date.now() - 1000,
        userId: "user-123",
        refreshToken: "refresh-token",
        idToken: "old-id-token",
      };

      mockGetOidcDiscovery.mockResolvedValue({
        tokenEndpoint: "https://oidc.example.com/token",
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
            id_token: "new-id-token",
            expires_in: 3600,
            refresh_expires_in: 86400,
          }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await refreshTokenWithProvider(tokenData);

      expect(result).not.toBeNull();
      expect(result?.accessToken).toBe("new-access-token");
      expect(result?.refreshToken).toBe("new-refresh-token");
      expect(result?.idToken).toBe("new-id-token");
      expect(result?.userId).toBe("user-123");
      expect(result?.accessTokenExpiresAt).toBeGreaterThan(Date.now());
      expect(result?.refreshTokenExpiresAt).toBeGreaterThan(Date.now());
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Token] Refreshed successfully",
      );
    });

    it("should keep old refresh token if not returned by provider", async () => {
      const tokenData = {
        accessToken: "old-token",
        accessTokenExpiresAt: Date.now() - 1000,
        userId: "user-123",
        refreshToken: "original-refresh-token",
      };

      mockGetOidcDiscovery.mockResolvedValue({
        tokenEndpoint: "https://oidc.example.com/token",
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "new-access-token",
            expires_in: 3600,
            // No refresh_token in response
          }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await refreshTokenWithProvider(tokenData);

      expect(result).not.toBeNull();
      expect(result?.refreshToken).toBe("original-refresh-token");
    });

    it("should return null on fetch error", async () => {
      const tokenData = {
        accessToken: "test-token",
        accessTokenExpiresAt: Date.now() - 1000,
        userId: "user-123",
        refreshToken: "refresh-token",
      };

      mockGetOidcDiscovery.mockResolvedValue({
        tokenEndpoint: "https://oidc.example.com/token",
      });

      const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
      vi.stubGlobal("fetch", mockFetch);

      const result = await refreshTokenWithProvider(tokenData);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Token] Refresh error:",
        expect.any(Error),
      );
    });
  });
});
