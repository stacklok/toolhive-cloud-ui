import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock pg Pool
const mockQuery = vi.hoisted(() => vi.fn());
vi.mock("pg", () => ({
  Pool: class MockPool {
    query = mockQuery;
  },
}));

// Mock constants to ensure DATABASE_URL is set
vi.mock("../constants", async (importOriginal) => {
  const original = await importOriginal<typeof import("../constants")>();
  return {
    ...original,
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  };
});

describe("db", () => {
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

  describe("updateAccountTokens", () => {
    it("updates account tokens successfully", async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const { updateAccountTokens } = await import("../db");
      const result = await updateAccountTokens(
        "account-123",
        "new-access-token",
        "new-refresh-token",
        "new-id-token",
        new Date(Date.now() + 3600000),
        new Date(Date.now() + 86400000),
      );

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE account"),
        expect.arrayContaining([
          "new-access-token",
          "new-refresh-token",
          "new-id-token",
          expect.any(Date),
          expect.any(Date),
          "account-123",
        ]),
      );
    });

    it("handles null refreshTokenExpiresAt", async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const { updateAccountTokens } = await import("../db");
      const result = await updateAccountTokens(
        "account-123",
        "access-token",
        "refresh-token",
        null,
        new Date(),
        null,
      );

      expect(result).toBe(true);
    });

    it("returns false on database error", async () => {
      mockQuery.mockRejectedValue(new Error("Database error"));

      const { updateAccountTokens } = await import("../db");
      const result = await updateAccountTokens(
        "account-123",
        "access-token",
        "refresh-token",
        null,
        new Date(),
        null,
      );

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[DB] Error updating account tokens:",
        expect.any(Error),
      );
    });
  });

  describe("getAccountForRefresh", () => {
    it("returns account when found", async () => {
      const mockAccount = {
        id: "account-123",
        refreshToken: "refresh-token",
        refreshTokenExpiresAt: new Date(),
        idToken: "id-token",
      };
      mockQuery.mockResolvedValue({ rows: [mockAccount] });

      const { getAccountForRefresh } = await import("../db");
      const result = await getAccountForRefresh("user-123");

      expect(result).toEqual(mockAccount);
    });

    it("returns null when no account found", async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const { getAccountForRefresh } = await import("../db");
      const result = await getAccountForRefresh("user-123");

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[DB] No account found for refresh",
      );
    });

    it("returns null on database error", async () => {
      mockQuery.mockRejectedValue(new Error("Connection failed"));

      const { getAccountForRefresh } = await import("../db");
      const result = await getAccountForRefresh("user-123");

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[DB] Error getting account for refresh:",
        expect.any(Error),
      );
    });
  });
});
