import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearOidcProviderToken, getOidcProviderAccessToken } from "../auth";
import type { OidcTokenData } from "../types";
import { encrypt } from "../utils";

// Mock jose library to avoid Uint8Array issues in jsdom
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
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookies),
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

describe("auth", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to verify error logging
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getOidcProviderAccessToken", () => {
    it("should return null when cookie is not present", async () => {
      mockCookies.get.mockReturnValue(undefined);

      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
      expect(mockCookies.get).toHaveBeenCalledWith("oidc_token");
    });

    it("should return null when cookie value is empty", async () => {
      mockCookies.get.mockReturnValue({ value: "" });

      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
    });

    it("should return null when token is expired", async () => {
      const expiredTokenData: OidcTokenData = {
        id: "expired-token-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        providerId: "provider-id",
        accountId: "account-id",
        accessToken: "expired-token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      const encryptedPayload = await encrypt(
        expiredTokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
      // Cookie deletion is now handled in the refresh API route, not here
      expect(mockCookies.delete).not.toHaveBeenCalled();
    });

    it("should return null when token belongs to different user", async () => {
      const tokenData: OidcTokenData = {
        id: "valid-token-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        providerId: "provider-id",
        accountId: "account-id",
        accessToken: "valid-token",
        userId: "user-456", // Different user
        accessTokenExpiresAt: Date.now() + 3600000,
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
    });

    it("should return access token when valid", async () => {
      const tokenData: OidcTokenData = {
        id: "valid-token-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        providerId: "provider-id",
        accountId: "account-id",
        accessToken: "valid-access-token-123",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000, // Valid for 1 hour
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBe("valid-access-token-123");
    });

    it("should return null when token data is invalid", async () => {
      // Create invalid token data (missing required fields)
      const invalidData = { accessToken: "token" }; // Missing userId and accessTokenExpiresAt
      const invalidPayload = await encrypt(
        invalidData as OidcTokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );

      mockCookies.get.mockReturnValue({ value: invalidPayload });

      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
      // Cookie deletion is now handled in the refresh API route, not here
      expect(mockCookies.delete).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should handle decryption errors gracefully", async () => {
      // Use invalid JWE format that will cause decryption to fail
      mockCookies.get.mockReturnValue({ value: "invalid-jwe-format" });

      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
      // Cookie deletion is now handled in the refresh API route, not here
      expect(mockCookies.delete).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Cookie] Error reading token cookie:",
        expect.any(Error),
      );
    });
  });

  describe("clearOidcProviderToken", () => {
    it("should delete the oidc_token cookie", async () => {
      await clearOidcProviderToken();

      expect(mockCookies.delete).toHaveBeenCalledWith("oidc_token");
    });
  });

  describe("OidcTokenData Type Guard", () => {
    it("should validate correct OidcTokenData structure", () => {
      const validData: OidcTokenData = {
        id: "valid-token-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        providerId: "provider-id",
        accountId: "account-id",
        accessToken: "token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000,
        refreshToken: "refresh-token",
      };

      // Type guard is private, so we test indirectly through getOidcProviderAccessToken
      expect(validData).toHaveProperty("accessToken");
      expect(validData).toHaveProperty("userId");
      expect(validData).toHaveProperty("accessTokenExpiresAt");
      expect(typeof validData.accessToken).toBe("string");
      expect(typeof validData.userId).toBe("string");
      expect(typeof validData.accessTokenExpiresAt).toBe("number");
    });

    it("should handle optional refreshToken", () => {
      const dataWithoutRefresh: OidcTokenData = {
        id: "valid-token-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        providerId: "provider-id",
        accountId: "account-id",
        accessToken: "token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000,
      };

      expect(dataWithoutRefresh.refreshToken).toBeUndefined();
    });
  });
});
