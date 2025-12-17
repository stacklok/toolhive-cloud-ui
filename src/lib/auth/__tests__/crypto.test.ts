import { afterEach, describe, expect, it, vi } from "vitest";
import { decrypt, isOidcTokenData } from "../crypto";

// Mock jose module for error cases
vi.mock("jose", async (importOriginal) => {
  const original = await importOriginal<typeof import("jose")>();
  return {
    ...original,
    compactDecrypt: vi.fn(original.compactDecrypt),
  };
});

describe("crypto", () => {
  const testSecret = "test-secret-at-least-32-characters-long";

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("decrypt error handling", () => {
    it("throws on invalid token data structure", async () => {
      const jose = await import("jose");
      // Mock compactDecrypt to return data that doesn't pass isOidcTokenData
      vi.mocked(jose.compactDecrypt).mockResolvedValueOnce({
        plaintext: new TextEncoder().encode(JSON.stringify({ foo: "bar" })),
        protectedHeader: { alg: "dir", enc: "A256GCM" },
        key: new Uint8Array(32),
      });

      await expect(decrypt("some-jwe", testSecret)).rejects.toThrow(
        "Token decryption error: Invalid token data structure",
      );
    });

    it("throws on JWEDecryptionFailed error", async () => {
      const jose = await import("jose");
      const decryptionError = new jose.errors.JWEDecryptionFailed();
      vi.mocked(jose.compactDecrypt).mockRejectedValueOnce(decryptionError);

      await expect(decrypt("some-jwe", testSecret)).rejects.toThrow(
        "Token decryption failed - possible tampering",
      );
    });

    it("throws on JWEInvalid error for malformed JWE", async () => {
      const jose = await import("jose");
      const invalidError = new jose.errors.JWEInvalid("Invalid JWE");
      vi.mocked(jose.compactDecrypt).mockRejectedValueOnce(invalidError);

      await expect(decrypt("not-a-valid-jwe", testSecret)).rejects.toThrow(
        "Invalid JWE format",
      );
    });
  });

  describe("isOidcTokenData", () => {
    it("returns false for null", () => {
      expect(isOidcTokenData(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isOidcTokenData(undefined)).toBe(false);
    });

    it("returns false for non-object types", () => {
      expect(isOidcTokenData("string")).toBe(false);
      expect(isOidcTokenData(123)).toBe(false);
      expect(isOidcTokenData(true)).toBe(false);
    });

    it("returns false when accessToken is missing", () => {
      expect(
        isOidcTokenData({
          userId: "user-123",
          accessTokenExpiresAt: Date.now(),
        }),
      ).toBe(false);
    });

    it("returns false when userId is missing", () => {
      expect(
        isOidcTokenData({
          accessToken: "token",
          accessTokenExpiresAt: Date.now(),
        }),
      ).toBe(false);
    });

    it("returns false when accessTokenExpiresAt is missing", () => {
      expect(
        isOidcTokenData({
          accessToken: "token",
          userId: "user-123",
        }),
      ).toBe(false);
    });

    it("returns false when accessToken is not a string", () => {
      expect(
        isOidcTokenData({
          accessToken: 123,
          userId: "user-123",
          accessTokenExpiresAt: Date.now(),
        }),
      ).toBe(false);
    });

    it("returns false when refreshToken is present but not a string", () => {
      expect(
        isOidcTokenData({
          accessToken: "token",
          userId: "user-123",
          accessTokenExpiresAt: Date.now(),
          refreshToken: 123,
        }),
      ).toBe(false);
    });

    it("returns false when refreshTokenExpiresAt is present but not a number", () => {
      expect(
        isOidcTokenData({
          accessToken: "token",
          userId: "user-123",
          accessTokenExpiresAt: Date.now(),
          refreshTokenExpiresAt: "not-a-number",
        }),
      ).toBe(false);
    });

    it("returns true for valid minimal data", () => {
      expect(
        isOidcTokenData({
          accessToken: "token",
          userId: "user-123",
          accessTokenExpiresAt: Date.now(),
        }),
      ).toBe(true);
    });

    it("returns true for valid complete data", () => {
      expect(
        isOidcTokenData({
          accessToken: "token",
          userId: "user-123",
          accessTokenExpiresAt: Date.now(),
          refreshToken: "refresh-token",
          refreshTokenExpiresAt: Date.now() + 86400000,
        }),
      ).toBe(true);
    });
  });
});
