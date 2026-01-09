import type { Account } from "better-auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { encrypt } from "../crypto";
import type { OidcTokenData } from "../types";
import {
  getOidcIdToken,
  getUserInfoFromIdToken,
  saveAccountToken,
} from "../utils";

// Mock cookies store (hoisted for use in vi.mock)
const mockCookies = vi.hoisted(() => ({
  get: vi.fn(),
  getAll: vi.fn(() => []),
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

describe("utils", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Suppress console.log/warn during tests
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
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
        "[Cookie] Error reading token cookie:",
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
        "[Cookie] Error reading token cookie:",
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
    });

    it("does not save cookie when accessToken is missing", async () => {
      const account = {
        id: "account-id",
        userId: "user-123",
        accessToken: null,
      } as unknown as Account;

      await saveAccountToken(account);

      expect(mockCookies.set).not.toHaveBeenCalled();
    });

    it("does not save cookie when userId is missing", async () => {
      const account = {
        id: "account-id",
        accessToken: "access-token",
        userId: null,
      } as unknown as Account;

      await saveAccountToken(account);

      expect(mockCookies.set).not.toHaveBeenCalled();
    });
  });

  describe("getUserInfoFromIdToken", () => {
    /**
     * Helper to create a mock JWT with given payload
     */
    function createMockJwt(payload: Record<string, unknown>): string {
      const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString(
        "base64",
      );
      const body = Buffer.from(JSON.stringify(payload)).toString("base64");
      const signature = "mock-signature";
      return `${header}.${body}.${signature}`;
    }

    it("returns null when idToken is undefined", () => {
      const result = getUserInfoFromIdToken(undefined);
      expect(result).toBeNull();
    });

    it("returns null when idToken is empty string", () => {
      const result = getUserInfoFromIdToken("");
      expect(result).toBeNull();
    });

    it("extracts email from standard OIDC claim", () => {
      const jwt = createMockJwt({
        sub: "user-123",
        email: "user@example.com",
        name: "Test User",
        picture: "https://example.com/photo.jpg",
        email_verified: true,
      });

      const result = getUserInfoFromIdToken(jwt);

      expect(result).toEqual({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        image: "https://example.com/photo.jpg",
        emailVerified: true,
      });
    });

    it("uses preferred_username as email fallback (Azure AD)", () => {
      const jwt = createMockJwt({
        sub: "user-123",
        preferred_username: "user@company.onmicrosoft.com",
        name: "Azure User",
      });

      const result = getUserInfoFromIdToken(jwt);

      expect(result).toEqual({
        id: "user-123",
        email: "user@company.onmicrosoft.com",
        name: "Azure User",
        image: undefined,
        emailVerified: false,
      });
    });

    it("uses upn as email fallback (Azure AD)", () => {
      const jwt = createMockJwt({
        sub: "user-123",
        upn: "user@company.com",
        given_name: "John",
      });

      const result = getUserInfoFromIdToken(jwt);

      expect(result).toEqual({
        id: "user-123",
        email: "user@company.com",
        name: "John",
        image: undefined,
        emailVerified: false,
      });
    });

    it("uses unique_name as email fallback (Azure AD legacy)", () => {
      const jwt = createMockJwt({
        sub: "user-123",
        unique_name: "legacy@company.com",
      });

      const result = getUserInfoFromIdToken(jwt);

      expect(result).toEqual({
        id: "user-123",
        email: "legacy@company.com",
        name: undefined,
        image: undefined,
        emailVerified: false,
      });
    });

    it("uses oid as id fallback when sub is missing (Azure AD)", () => {
      const jwt = createMockJwt({
        oid: "azure-object-id",
        email: "user@example.com",
      });

      const result = getUserInfoFromIdToken(jwt);

      expect(result?.id).toBe("azure-object-id");
    });

    it("returns null email when no email claims present", () => {
      const jwt = createMockJwt({
        sub: "user-123",
        name: "No Email User",
      });

      const result = getUserInfoFromIdToken(jwt);

      expect(result).toEqual({
        id: "user-123",
        email: null,
        name: "No Email User",
        image: undefined,
        emailVerified: false,
      });
    });

    it("returns null and logs error on invalid JWT format", () => {
      const result = getUserInfoFromIdToken("not-a-valid-jwt");

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Auth] Failed to decode ID token:",
        expect.any(Error),
      );
    });

    it("returns null and logs error on malformed base64 payload", () => {
      const result = getUserInfoFromIdToken("header.!!!invalid-base64!!!.sig");

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Auth] Failed to decode ID token:",
        expect.any(Error),
      );
    });
  });
});
