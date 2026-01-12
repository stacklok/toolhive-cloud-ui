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
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookies),
}));

// Import after mocks
import { encrypt } from "../crypto";
import {
  getOidcIdToken,
  getUserInfoFromIdToken,
  getUserInfoFromTokens,
  saveAccountToken,
} from "../utils";

describe("utils", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
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

    it("does not save token when accessToken is missing", async () => {
      const account = {
        id: "account-id",
        userId: "user-123",
        accessToken: null,
      } as unknown as Account;

      await saveAccountToken(account);

      expect(mockCookies.set).not.toHaveBeenCalled();
    });

    it("does not save token when userId is missing", async () => {
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
    // Helper to create a mock JWT
    const createMockJwt = (payload: object): string => {
      const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString(
        "base64",
      );
      const body = Buffer.from(JSON.stringify(payload)).toString("base64");
      return `${header}.${body}.signature`;
    };

    it("returns null when idToken is undefined", () => {
      const result = getUserInfoFromIdToken(undefined);
      expect(result).toBeNull();
    });

    it("returns null for invalid JWT format", () => {
      const result = getUserInfoFromIdToken("not-a-jwt");
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Auth] Invalid JWT format: expected 3 parts",
      );
    });

    it("extracts standard OIDC claims", () => {
      const jwt = createMockJwt({
        sub: "user-123",
        email: "user@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
        email_verified: true,
      });

      const result = getUserInfoFromIdToken(jwt);

      expect(result).toEqual({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
        emailVerified: true,
      });
    });

    it("handles Azure AD claims (preferred_username)", () => {
      const jwt = createMockJwt({
        oid: "azure-oid",
        preferred_username: "azure@example.com",
        given_name: "Azure User",
      });

      const result = getUserInfoFromIdToken(jwt);

      expect(result).toEqual({
        id: "azure-oid",
        email: "azure@example.com",
        name: "Azure User",
        image: undefined,
        emailVerified: false,
      });
    });

    it("returns null and logs error on malformed payload", () => {
      const result = getUserInfoFromIdToken("header.not-valid-base64.sig");
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Auth] Failed to decode ID token:",
        expect.any(Error),
      );
    });
  });

  describe("getUserInfoFromTokens", () => {
    const mockDiscoveryUrl =
      "https://oidc.example.com/.well-known/openid-configuration";

    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns user info from ID token when available", async () => {
      const jwt =
        Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64") +
        "." +
        Buffer.from(
          JSON.stringify({
            sub: "user-123",
            email: "user@example.com",
            name: "Test User",
          }),
        ).toString("base64") +
        ".signature";

      const result = await getUserInfoFromTokens(
        { idToken: jwt, accessToken: "access-token" },
        mockDiscoveryUrl,
      );

      expect(result).toEqual({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        image: undefined,
        emailVerified: false,
      });
      // Should not call fetch since ID token has email
      expect(fetch).not.toHaveBeenCalled();
    });

    it("falls back to userinfo endpoint when ID token has no email", async () => {
      const jwt =
        Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64") +
        "." +
        Buffer.from(JSON.stringify({ sub: "user-123" })).toString("base64") +
        ".signature";

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              userinfo_endpoint: "https://oidc.example.com/userinfo",
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              sub: "user-123",
              email: "user@example.com",
              name: "Test User",
            }),
        } as Response);

      const result = await getUserInfoFromTokens(
        { idToken: jwt, accessToken: "access-token" },
        mockDiscoveryUrl,
      );

      expect(result).toEqual({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        image: undefined,
        emailVerified: false,
      });
    });

    it("returns null when both ID token and userinfo fail", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await getUserInfoFromTokens(
        { accessToken: "access-token" },
        mockDiscoveryUrl,
      );

      expect(result).toBeNull();
    });

    it("returns null when no access token for userinfo", async () => {
      const result = await getUserInfoFromTokens({}, mockDiscoveryUrl);
      expect(result).toBeNull();
    });
  });
});
