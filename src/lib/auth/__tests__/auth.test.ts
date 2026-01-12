import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Unmock token module to test the real implementation
vi.unmock("@/lib/auth/token");

// Mock pg Pool before importing auth
const mockQuery = vi.hoisted(() => vi.fn());
vi.mock("pg", () => ({
  Pool: class MockPool {
    query = mockQuery;
  },
}));

// Mock better-auth
vi.mock("better-auth", () => ({
  betterAuth: vi.fn(() => ({
    api: {
      getSession: vi.fn(),
    },
  })),
}));

vi.mock("better-auth/plugins", () => ({
  genericOAuth: vi.fn(() => ({})),
}));

// Mock constants to ensure DATABASE_URL is set
vi.mock("../constants", async (importOriginal) => {
  const original = await importOriginal<typeof import("../constants")>();
  return {
    ...original,
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  };
});

describe("auth", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getOidcProviderAccessToken", () => {
    it("should return null when no account found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const { getOidcProviderAccessToken } = await import("../auth");
      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[DB] No account found for user:",
        "user-123",
      );
    });

    it("should return null when access token is null", async () => {
      mockQuery.mockResolvedValue({
        rows: [{ accessToken: null, accessTokenExpiresAt: null }],
      });

      const { getOidcProviderAccessToken } = await import("../auth");
      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[DB] No access token in account",
      );
    });

    it("should return null when token is expired", async () => {
      const expiredDate = new Date(Date.now() - 1000); // Expired 1 second ago
      mockQuery.mockResolvedValue({
        rows: [
          {
            accessToken: "expired-token",
            accessTokenExpiresAt: expiredDate,
          },
        ],
      });

      const { getOidcProviderAccessToken } = await import("../auth");
      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith("[DB] Access token expired");
    });

    it("should return access token when valid", async () => {
      const validDate = new Date(Date.now() + 3600000); // Valid for 1 hour
      mockQuery.mockResolvedValue({
        rows: [
          {
            accessToken: "valid-access-token-123",
            accessTokenExpiresAt: validDate,
          },
        ],
      });

      const { getOidcProviderAccessToken } = await import("../auth");
      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBe("valid-access-token-123");
    });

    it("should return access token when no expiration set", async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            accessToken: "token-no-expiry",
            accessTokenExpiresAt: null,
          },
        ],
      });

      const { getOidcProviderAccessToken } = await import("../auth");
      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBe("token-no-expiry");
    });

    it("should handle database errors gracefully", async () => {
      mockQuery.mockRejectedValue(new Error("Database connection failed"));

      const { getOidcProviderAccessToken } = await import("../auth");
      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[DB] Error reading token from database:",
        expect.any(Error),
      );
    });
  });

  describe("getOidcIdToken", () => {
    it("should return null when no account found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const { getOidcIdToken } = await import("../auth");
      const token = await getOidcIdToken("user-123");

      expect(token).toBeNull();
    });

    it("should return id token when found", async () => {
      mockQuery.mockResolvedValue({
        rows: [{ idToken: "id-token-123" }],
      });

      const { getOidcIdToken } = await import("../auth");
      const token = await getOidcIdToken("user-123");

      expect(token).toBe("id-token-123");
    });

    it("should handle database errors gracefully", async () => {
      mockQuery.mockRejectedValue(new Error("Database error"));

      const { getOidcIdToken } = await import("../auth");
      const token = await getOidcIdToken("user-123");

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[DB] Error reading ID token from database:",
        expect.any(Error),
      );
    });
  });

  describe("refreshAccessToken", () => {
    it("should return null when no account found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const { refreshAccessToken } = await import("../token");
      const token = await refreshAccessToken("user-123");

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[DB] No account found for refresh",
      );
    });

    it("should return null when no refresh token available", async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: "account-1",
            refreshToken: null,
            refreshTokenExpiresAt: null,
            idToken: null,
          },
        ],
      });

      const { refreshAccessToken } = await import("../token");
      const token = await refreshAccessToken("user-123");

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Token] No refresh token available",
      );
    });

    it("should return null when refresh token is expired", async () => {
      const expiredDate = new Date(Date.now() - 1000);
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: "account-1",
            refreshToken: "expired-refresh",
            refreshTokenExpiresAt: expiredDate,
            idToken: null,
          },
        ],
      });

      const { refreshAccessToken } = await import("../token");
      const token = await refreshAccessToken("user-123");

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Token] Refresh token expired",
      );
    });
  });
});
