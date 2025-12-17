import type { Account } from "better-auth";
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
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookies),
}));

// Import after mocks
import { encrypt } from "../crypto";
import { getOidcIdToken, saveAccountToken } from "../utils";

describe("utils", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getOidcIdToken", () => {
    it("returns null when cookie is not present", async () => {
      mockCookies.get.mockReturnValue(undefined);

      const token = await getOidcIdToken("user-123");

      expect(token).toBeNull();
    });

    it("returns null when cookie value is empty", async () => {
      mockCookies.get.mockReturnValue({ value: "" });

      const token = await getOidcIdToken("user-123");

      expect(token).toBeNull();
    });

    it("returns null when decryption fails", async () => {
      mockCookies.get.mockReturnValue({ value: "invalid-jwe" });

      const token = await getOidcIdToken("user-123");

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Auth] Token decryption failed:",
        expect.any(Error),
      );
    });

    it("returns null when userId does not match", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "access-token",
        userId: "different-user",
        accessTokenExpiresAt: Date.now() + 3600000,
        idToken: "id-token-123",
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getOidcIdToken("user-123");

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Auth] Token userId mismatch",
      );
    });

    it("returns idToken when valid", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "access-token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000,
        idToken: "id-token-123",
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getOidcIdToken("user-123");

      expect(token).toBe("id-token-123");
    });

    it("returns null when idToken is not present", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "access-token",
        userId: "user-123",
        accessTokenExpiresAt: Date.now() + 3600000,
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getOidcIdToken("user-123");

      expect(token).toBeNull();
    });

    it("returns null and logs error on unexpected error", async () => {
      // Mock cookies() to throw an unexpected error
      const { cookies } = await import("next/headers");
      vi.mocked(cookies).mockRejectedValueOnce(new Error("Unexpected error"));

      const token = await getOidcIdToken("user-123");

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Auth] Unexpected error reading OIDC ID token:",
        expect.any(Error),
      );
    });
  });

  describe("saveAccountToken", () => {
    it("saves token when account has accessToken and userId", async () => {
      const account: Account = {
        id: "account-id",
        accountId: "account-id",
        providerId: "oidc",
        userId: "user-123",
        accessToken: "access-token",
        refreshToken: "refresh-token",
        idToken: "id-token",
        accessTokenExpiresAt: new Date(Date.now() + 3600000),
        refreshTokenExpiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await saveAccountToken(account);

      expect(mockCookies.set).toHaveBeenCalledWith(
        "oidc_token",
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        }),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Save Token] Token cookie saved successfully",
      );
    });

    it("uses default expiration when accessTokenExpiresAt is not provided", async () => {
      const account: Account = {
        id: "account-id",
        accountId: "account-id",
        providerId: "oidc",
        userId: "user-123",
        accessToken: "access-token",
        refreshToken: null,
        idToken: null,
        accessTokenExpiresAt: null,
        refreshTokenExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await saveAccountToken(account);

      expect(mockCookies.set).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Save Token] Token cookie saved successfully",
      );
    });

    it("warns when accessToken is missing", async () => {
      const account = {
        id: "account-id",
        userId: "user-123",
        accessToken: null,
      } as unknown as Account;

      await saveAccountToken(account);

      expect(mockCookies.set).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Save Token] Missing accessToken or userId, not saving token",
      );
    });

    it("warns when userId is missing", async () => {
      const account = {
        id: "account-id",
        accessToken: "access-token",
        userId: null,
      } as unknown as Account;

      await saveAccountToken(account);

      expect(mockCookies.set).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Save Token] Missing accessToken or userId, not saving token",
      );
    });
  });
});
