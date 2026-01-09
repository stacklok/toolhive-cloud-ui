import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encrypt } from "@/lib/auth/crypto";
import { server } from "@/mocks/node";
import type { OidcTokenData } from "../types";

// Unmock @/lib/auth/token to test the real implementation
// (overrides the global mock from vitest.setup.ts)
vi.unmock("@/lib/auth/token");
// Import after unmocking to get the real function
const { getValidOidcToken } = await import("../token");

const REFRESH_API_URL = "http://localhost:3000/api/auth/refresh-token";

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

const mockNextHeaders = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookies),
  headers: mockNextHeaders,
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

describe("token", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockNextHeaders.mockResolvedValue({
      get: vi.fn().mockReturnValue("cookie=value"),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getValidOidcToken", () => {
    it("should return existing token if still valid", async () => {
      const userId = "user-123";
      const tokenData: OidcTokenData = {
        id: "valid-token-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        providerId: "provider-id",
        accountId: "account-id",
        accessToken: "valid-access-token",
        userId,
        accessTokenExpiresAt: Date.now() + 3600000, // Valid for 1 hour
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getValidOidcToken(userId);

      expect(token).toBe("valid-access-token");
      // Should not attempt refresh
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should refresh token if expired", async () => {
      const userId = "user-123";
      const expiredTokenData: OidcTokenData = {
        id: "expired-token-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        providerId: "provider-id",
        accountId: "account-id",
        accessToken: "expired-access-token",
        userId,
        accessTokenExpiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      const encryptedPayload = await encrypt(
        expiredTokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      // Mock refresh API
      server.use(
        http.post(REFRESH_API_URL, () => {
          return HttpResponse.json({
            success: true,
            accessToken: "new-access-token",
          });
        }),
      );

      const token = await getValidOidcToken(userId);

      expect(token).toBe("new-access-token");
    });

    it("should return null if token not found and refresh fails", async () => {
      const userId = "user-123";
      mockCookies.get.mockReturnValue(undefined);

      // Mock refresh API failure
      server.use(
        http.post(REFRESH_API_URL, () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Token] Refresh failed:",
        401,
      );
    });

    it("should return null if refresh API returns invalid response", async () => {
      const userId = "user-123";
      const expiredTokenData: OidcTokenData = {
        id: "expired-token-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        providerId: "provider-id",
        accountId: "account-id",
        accessToken: "expired-token",
        userId,
        accessTokenExpiresAt: Date.now() - 1000,
      };

      const encryptedPayload = await encrypt(
        expiredTokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      // Mock refresh API with invalid response
      server.use(
        http.post(REFRESH_API_URL, () => {
          return HttpResponse.json({
            success: false, // No accessToken
          });
        }),
      );

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
    });

    it("should handle network errors during refresh", async () => {
      const userId = "user-123";
      const expiredTokenData: OidcTokenData = {
        id: "expired-token-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        providerId: "provider-id",
        accountId: "account-id",
        accessToken: "expired-token",
        userId,
        accessTokenExpiresAt: Date.now() - 1000,
      };

      const encryptedPayload = await encrypt(
        expiredTokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      // Mock network error
      server.use(
        http.post(REFRESH_API_URL, () => {
          return HttpResponse.error();
        }),
      );

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Token] Refresh error:",
        expect.any(Error),
      );
    });
  });

  describe("refreshOidcAccessToken (internal)", () => {
    it("should successfully refresh token via API", async () => {
      const userId = "user-123";

      // Mock refresh API success
      server.use(
        http.post(REFRESH_API_URL, () => {
          return HttpResponse.json({
            success: true,
            accessToken: "new-refreshed-token",
          });
        }),
      );

      const token = await getValidOidcToken(userId);

      expect(token).toBe("new-refreshed-token");
    });

    it("should handle 401 errors from refresh API", async () => {
      const userId = "user-123";
      mockCookies.get.mockReturnValue(undefined);

      server.use(
        http.post(REFRESH_API_URL, () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Token] Refresh failed:",
        401,
      );
    });

    it("should handle 500 errors from refresh API", async () => {
      const userId = "user-123";
      mockCookies.get.mockReturnValue(undefined);

      server.use(
        http.post(REFRESH_API_URL, () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "[Token] Refresh failed:",
        500,
      );
    });

    it("should pass cookies to refresh API", async () => {
      const userId = "user-123";
      mockCookies.get.mockReturnValue(undefined);

      let receivedHeaders: Headers | undefined;

      server.use(
        http.post(REFRESH_API_URL, ({ request }) => {
          receivedHeaders = request.headers;
          return HttpResponse.json({
            success: true,
            accessToken: "new-token",
          });
        }),
      );

      await getValidOidcToken(userId);

      expect(receivedHeaders?.get("cookie")).toBe("cookie=value");
    });
  });

  describe("Token Refresh Integration", () => {
    it("should handle complete refresh flow end-to-end", async () => {
      const userId = "user-123";
      const expiredTokenData: OidcTokenData = {
        id: "expired-token-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        providerId: "provider-id",
        accountId: "account-id",
        accessToken: "expired-token",
        refreshToken: "valid-refresh-token",
        userId,
        accessTokenExpiresAt: Date.now() - 1000,
        refreshTokenExpiresAt: Date.now() + 86400000,
      };

      const encryptedPayload = await encrypt(
        expiredTokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      // Mock refresh API
      server.use(
        http.post(REFRESH_API_URL, () => {
          return HttpResponse.json({
            success: true,
            accessToken: "brand-new-token",
          });
        }),
      );

      const token = await getValidOidcToken(userId);

      expect(token).toBe("brand-new-token");
    });

    it("should return null for multiple failed refresh attempts", async () => {
      const userId = "user-123";
      mockCookies.get.mockReturnValue(undefined);

      server.use(
        http.post(REFRESH_API_URL, () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      const token1 = await getValidOidcToken(userId);
      const token2 = await getValidOidcToken(userId);

      expect(token1).toBeNull();
      expect(token2).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });
  });
});
