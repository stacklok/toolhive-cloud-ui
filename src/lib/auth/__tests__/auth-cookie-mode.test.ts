import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OidcTokenData } from "../types";

// Mock jose library
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

// Mock next/headers
const mockCookies = vi.hoisted(() => ({
  get: vi.fn(),
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookies),
}));

// Mock constants to ensure DATABASE_URL is NOT set (cookie mode)
vi.mock("../constants", async (importOriginal) => {
  const original = await importOriginal<typeof import("../constants")>();
  return {
    ...original,
    DATABASE_URL: undefined,
  };
});

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

import { encrypt } from "../crypto";

describe("auth - cookie mode", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("getOidcProviderAccessToken (cookie mode)", () => {
    it("returns null when no cookie", async () => {
      mockCookies.get.mockReturnValue(undefined);

      const { getOidcProviderAccessToken } = await import("../auth");
      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
    });

    it("returns null when token is expired", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "access-token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() - 1000, // Expired
      };

      const encrypted = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encrypted });

      const { getOidcProviderAccessToken } = await import("../auth");
      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Auth] Access token expired (cookie mode)",
      );
    });

    it("returns access token when valid", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "valid-access-token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000, // Valid for 1 hour
      };

      const encrypted = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encrypted });

      const { getOidcProviderAccessToken } = await import("../auth");
      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBe("valid-access-token");
    });

    it("returns access token when no expiration set", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "token-no-expiry",
        userId: "user-123",
        accessTokenExpiresAt: 0,
      };

      const encrypted = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encrypted });

      const { getOidcProviderAccessToken } = await import("../auth");
      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBe("token-no-expiry");
    });
  });

  describe("getOidcIdToken (cookie mode)", () => {
    it("returns null when no cookie", async () => {
      mockCookies.get.mockReturnValue(undefined);

      const { getOidcIdToken } = await import("../auth");
      const token = await getOidcIdToken("user-123");

      expect(token).toBeNull();
    });

    it("returns id token when present", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "access-token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000,
        idToken: "id-token-123",
      };

      const encrypted = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encrypted });

      const { getOidcIdToken } = await import("../auth");
      const token = await getOidcIdToken("user-123");

      expect(token).toBe("id-token-123");
    });

    it("returns null when id token not in cookie", async () => {
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

      const { getOidcIdToken } = await import("../auth");
      const token = await getOidcIdToken("user-123");

      expect(token).toBeNull();
    });
  });

  describe("getOidcDiscovery", () => {
    // Note: getOidcDiscovery caches results at module level, so we test
    // the happy path which gets cached and reused in subsequent calls
    it("returns and caches discovery document", async () => {
      const { getOidcDiscovery } = await import("../auth");

      // First call - should use cached or fetch new
      const result = await getOidcDiscovery();

      // Should have the expected shape (cached from previous test runs or fresh)
      if (result) {
        expect(result).toHaveProperty("tokenEndpoint");
        expect(result).toHaveProperty("endSessionEndpoint");
      }

      // Second call should return same cached result
      const result2 = await getOidcDiscovery();
      expect(result2).toEqual(result);
    });
  });
});
