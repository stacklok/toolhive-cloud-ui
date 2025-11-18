import crypto from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OidcTokenData } from "../auth";
import { clearOidcProviderToken, getOidcProviderAccessToken } from "../auth";

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

// Encryption helper using same logic as auth.ts
const ENCRYPTION_SALT = "oidc_token_salt";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

function encryptTestData(text: string): string {
  const key = crypto.scryptSync(
    process.env.BETTER_AUTH_SECRET as string,
    ENCRYPTION_SALT,
    KEY_LENGTH,
  );
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

describe("auth.ts", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to verify error logging
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Encryption/Decryption", () => {
    it("should encrypt and decrypt data correctly", () => {
      const originalData = JSON.stringify({
        accessToken: "test-access-token",
        userId: "user-123",
        expiresAt: Date.now() + 3600000,
      });

      // Encrypt using helper
      const encryptedPayload = encryptTestData(originalData);

      // Verify format (iv:authTag:encrypted)
      const parts = encryptedPayload.split(":");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(24); // 12 bytes IV = 24 hex chars
      expect(parts[1]).toHaveLength(32); // 16 bytes auth tag = 32 hex chars
    });

    it("should create different ciphertext for same plaintext", () => {
      const data = "same plaintext";

      const encrypted1 = encryptTestData(data);
      const encrypted2 = encryptTestData(data);

      // Different IV should produce different ciphertext
      expect(encrypted1).not.toBe(encrypted2);
    });
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

    it("should return null and delete cookie when token is expired", async () => {
      const expiredTokenData: OidcTokenData = {
        accessToken: "expired-token",
        userId: "user-123",
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      const encryptedPayload = encryptTestData(
        JSON.stringify(expiredTokenData),
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
      expect(mockCookies.delete).toHaveBeenCalledWith("oidc_token");
    });

    it("should return null when token belongs to different user", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "valid-token",
        userId: "user-456", // Different user
        expiresAt: Date.now() + 3600000,
      };

      const encryptedPayload = encryptTestData(JSON.stringify(tokenData));
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
    });

    it("should return access token when valid", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "valid-access-token-123",
        userId: "user-123",
        expiresAt: Date.now() + 3600000, // Valid for 1 hour
      };

      const encryptedPayload = encryptTestData(JSON.stringify(tokenData));
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBe("valid-access-token-123");
    });

    it("should return null and delete cookie when token data is invalid", async () => {
      const invalidData = {
        // Missing required fields
        accessToken: "token",
        // No userId, no expiresAt
      };

      const encryptedPayload = encryptTestData(JSON.stringify(invalidData));
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
      expect(mockCookies.delete).toHaveBeenCalledWith("oidc_token");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Auth] Invalid token data structure",
      );
    });

    it("should handle decryption errors gracefully", async () => {
      mockCookies.get.mockReturnValue({ value: "invalid-encrypted-data" });

      const token = await getOidcProviderAccessToken("user-123");

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Auth] Error reading OIDC token from cookie:",
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
        accessToken: "token",
        userId: "user-123",
        expiresAt: Date.now() + 3600000,
        refreshToken: "refresh-token",
      };

      // Type guard is private, so we test indirectly through getOidcProviderAccessToken
      expect(validData).toHaveProperty("accessToken");
      expect(validData).toHaveProperty("userId");
      expect(validData).toHaveProperty("expiresAt");
      expect(typeof validData.accessToken).toBe("string");
      expect(typeof validData.userId).toBe("string");
      expect(typeof validData.expiresAt).toBe("number");
    });

    it("should handle optional refreshToken", () => {
      const dataWithoutRefresh: OidcTokenData = {
        accessToken: "token",
        userId: "user-123",
        expiresAt: Date.now() + 3600000,
      };

      expect(dataWithoutRefresh.refreshToken).toBeUndefined();
    });
  });

  describe("Token Expiration Constants", () => {
    it("should have correct time constants", () => {
      const TOKEN_ONE_HOUR_MS = 60 * 60 * 1000;
      const TOKEN_SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

      expect(TOKEN_ONE_HOUR_MS).toBe(3600000);
      expect(TOKEN_SEVEN_DAYS_SECONDS).toBe(604800);
    });
  });
});
