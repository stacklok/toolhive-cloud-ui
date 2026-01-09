import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readTokenCookie, saveTokenCookie } from "../cookie";
import { encrypt } from "../crypto";
import type { OidcTokenData } from "../types";

// Mock cookies store (hoisted for use in vi.mock)
const mockCookies = vi.hoisted(() => ({
  get: vi.fn(),
  getAll: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookies),
}));

vi.mock("jose", () => ({
  CompactEncrypt: class CompactEncrypt {
    constructor(private plaintext: Uint8Array) {}
    setProtectedHeader() {
      return this;
    }
    async encrypt() {
      return `mock-jwe-${Buffer.from(this.plaintext).toString("base64")}`;
    }
  },
  compactDecrypt: vi.fn().mockImplementation(async (jwe: string) => {
    if (jwe === "invalid-jwe") {
      throw new Error("Decryption failed");
    }
    const base64 = jwe.replace("mock-jwe-", "");
    const plaintext = Buffer.from(base64, "base64");
    return { plaintext };
  }),
  errors: {
    JWEDecryptionFailed: class JWEDecryptionFailed extends Error {},
    JWEInvalid: class JWEInvalid extends Error {},
  },
}));

describe("cookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console output during tests
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("saveTokenCookie", () => {
    it("saves small token data in a single cookie", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "short-token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000,
      };

      await saveTokenCookie(tokenData);

      // Should delete existing cookies first
      expect(mockCookies.delete).toHaveBeenCalledWith("oidc_token");
      // Should set a single cookie (not chunked)
      expect(mockCookies.set).toHaveBeenCalledWith(
        "oidc_token",
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      );
      // Should not create chunk cookies for small data
      const setCalls = mockCookies.set.mock.calls;
      const chunkCalls = setCalls.filter((call: string[]) =>
        call[0].includes("oidc_token."),
      );
      expect(chunkCalls).toHaveLength(0);
    });

    it("chunks large token data across multiple cookies", async () => {
      // Create a large token that will exceed chunk size (3896 bytes)
      const largeAccessToken = "x".repeat(5000);
      const tokenData: OidcTokenData = {
        accessToken: largeAccessToken,
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000,
      };

      await saveTokenCookie(tokenData);

      // Should delete existing chunks first
      expect(mockCookies.delete).toHaveBeenCalledWith("oidc_token");
      for (let i = 0; i < 10; i++) {
        expect(mockCookies.delete).toHaveBeenCalledWith(`oidc_token.${i}`);
      }

      // Should create chunked cookies
      const setCalls = mockCookies.set.mock.calls;
      const chunkCalls = setCalls.filter((call: string[]) =>
        call[0].startsWith("oidc_token."),
      );
      expect(chunkCalls.length).toBeGreaterThan(1);

      // Should not set the main cookie (only chunks)
      const mainCookieCalls = setCalls.filter(
        (call: string[]) => call[0] === "oidc_token",
      );
      expect(mainCookieCalls).toHaveLength(0);
    });

    it("cleans up old chunks before saving new data", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000,
      };

      await saveTokenCookie(tokenData);

      // Should delete main cookie and all potential chunks (0-9)
      expect(mockCookies.delete).toHaveBeenCalledWith("oidc_token");
      expect(mockCookies.delete).toHaveBeenCalledWith("oidc_token.0");
      expect(mockCookies.delete).toHaveBeenCalledWith("oidc_token.9");
    });
  });

  describe("readTokenCookie", () => {
    it("reads single (non-chunked) cookie", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "access-token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000,
      };

      const encrypted = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encrypted });
      mockCookies.getAll.mockReturnValue([]);

      const result = await readTokenCookie();

      expect(result).toEqual(tokenData);
    });

    it("reads and reassembles chunked cookies", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "access-token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000,
      };

      const encrypted = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );

      // Simulate chunked cookies (split the encrypted value)
      const midpoint = Math.floor(encrypted.length / 2);
      const chunk0 = encrypted.substring(0, midpoint);
      const chunk1 = encrypted.substring(midpoint);

      mockCookies.get.mockReturnValue(undefined); // No single cookie
      mockCookies.getAll.mockReturnValue([
        { name: "oidc_token.0", value: chunk0 },
        { name: "oidc_token.1", value: chunk1 },
      ]);

      const result = await readTokenCookie();

      expect(result).toEqual(tokenData);
    });

    it("reassembles chunks in correct order regardless of cookie order", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "access-token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000,
      };

      const encrypted = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );

      // Split into 3 parts
      const third = Math.floor(encrypted.length / 3);
      const chunk0 = encrypted.substring(0, third);
      const chunk1 = encrypted.substring(third, third * 2);
      const chunk2 = encrypted.substring(third * 2);

      mockCookies.get.mockReturnValue(undefined);
      // Return chunks in wrong order - should still work
      mockCookies.getAll.mockReturnValue([
        { name: "oidc_token.2", value: chunk2 },
        { name: "oidc_token.0", value: chunk0 },
        { name: "oidc_token.1", value: chunk1 },
      ]);

      const result = await readTokenCookie();

      expect(result).toEqual(tokenData);
    });

    it("returns null when no cookies exist", async () => {
      mockCookies.get.mockReturnValue(undefined);
      mockCookies.getAll.mockReturnValue([]);

      const result = await readTokenCookie();

      expect(result).toBeNull();
    });

    it("returns null when single cookie has empty value", async () => {
      mockCookies.get.mockReturnValue({ value: "" });
      mockCookies.getAll.mockReturnValue([]);

      const result = await readTokenCookie();

      expect(result).toBeNull();
    });

    it("ignores unrelated cookies when looking for chunks", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "access-token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000,
      };

      const encrypted = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );

      mockCookies.get.mockReturnValue(undefined);
      mockCookies.getAll.mockReturnValue([
        { name: "oidc_token.0", value: encrypted },
        { name: "some_other_cookie", value: "unrelated" },
        { name: "better_auth.session", value: "session-data" },
      ]);

      const result = await readTokenCookie();

      expect(result).toEqual(tokenData);
    });

    it("returns null and logs error on decryption failure", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error");
      mockCookies.get.mockReturnValue({ value: "invalid-jwe" });

      const result = await readTokenCookie();

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Cookie] Error reading token cookie:",
        expect.any(Error),
      );
    });
  });
});
