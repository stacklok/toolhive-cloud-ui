import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/mocks/node";
import type { OidcTokenData } from "../types";

// Unmock @/lib/auth/token to test the real implementation
vi.unmock("@/lib/auth/token");

const MOCK_TOKEN_ENDPOINT = "http://oidc-provider.test/token";

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
  getAll: vi.fn().mockReturnValue([]),
  set: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookies),
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("cookie=value"),
  }),
}));

// Mock ./db module to set isDatabaseMode = false (cookie mode)
vi.mock("../db", () => ({
  isDatabaseMode: false,
  pool: null,
  getAccountForRefresh: vi.fn(),
  updateAccountTokens: vi.fn(),
}));

// Mock ./auth module
const mockGetOidcProviderAccessToken = vi.fn();
const mockGetOidcDiscovery = vi.fn();

vi.mock("../auth", () => ({
  getOidcProviderAccessToken: (...args: unknown[]) =>
    mockGetOidcProviderAccessToken(...args),
  getOidcDiscovery: () => mockGetOidcDiscovery(),
}));

// Import after mocks
const { getValidOidcToken } = await import("../token");
const { encrypt } = await import("../crypto");

describe("token", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Default: discovery returns token endpoint
    mockGetOidcDiscovery.mockResolvedValue({
      tokenEndpoint: MOCK_TOKEN_ENDPOINT,
      endSessionEndpoint: "http://oidc-provider.test/logout",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getValidOidcToken", () => {
    it("should return existing token if still valid", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue("valid-access-token");

      const token = await getValidOidcToken(userId);

      expect(token).toBe("valid-access-token");
      expect(mockGetOidcProviderAccessToken).toHaveBeenCalledWith(userId);
      // Should not attempt refresh
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("attempting refresh"),
      );
    });

    it("should refresh token if existing token is expired", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue(null);

      const tokenData: OidcTokenData = {
        accessToken: "expired-access-token",
        refreshToken: "valid-refresh-token",
        userId,
        accessTokenExpiresAt: Date.now() - 1000, // Expired
        refreshTokenExpiresAt: Date.now() + 86400000, // Valid for 1 day
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      // Mock OIDC token endpoint
      server.use(
        http.post(MOCK_TOKEN_ENDPOINT, () => {
          return HttpResponse.json({
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
            expires_in: 3600,
          });
        }),
      );

      const token = await getValidOidcToken(userId);

      expect(token).toBe("new-access-token");
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Token] Access token expired or not found, attempting refresh",
      );
    });

    it("should return null if no refresh token available", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue(null);

      const tokenData: OidcTokenData = {
        accessToken: "expired-access-token",
        userId,
        accessTokenExpiresAt: Date.now() - 1000, // Expired
        // No refresh token
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Token] No refresh token in cookie",
      );
    });

    it("should return null if refresh token is expired", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue(null);

      const tokenData: OidcTokenData = {
        accessToken: "expired-access-token",
        refreshToken: "expired-refresh-token",
        userId,
        accessTokenExpiresAt: Date.now() - 1000, // Expired
        refreshTokenExpiresAt: Date.now() - 1000, // Also expired
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Token] Refresh token expired (cookie mode)",
      );
    });

    it("should return null if token endpoint is not available", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue(null);
      mockGetOidcDiscovery.mockResolvedValue(null);

      const tokenData: OidcTokenData = {
        accessToken: "expired-access-token",
        refreshToken: "valid-refresh-token",
        userId,
        accessTokenExpiresAt: Date.now() - 1000,
        refreshTokenExpiresAt: Date.now() + 86400000,
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Token] Token endpoint not available",
      );
    });

    it("should return null if OIDC token endpoint returns error", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue(null);

      const tokenData: OidcTokenData = {
        accessToken: "expired-access-token",
        refreshToken: "valid-refresh-token",
        userId,
        accessTokenExpiresAt: Date.now() - 1000,
        refreshTokenExpiresAt: Date.now() + 86400000,
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      // Mock OIDC token endpoint error
      server.use(
        http.post(MOCK_TOKEN_ENDPOINT, () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Token] Refresh failed:",
        401,
      );
    });

    it("should handle network errors during refresh", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue(null);

      const tokenData: OidcTokenData = {
        accessToken: "expired-access-token",
        refreshToken: "valid-refresh-token",
        userId,
        accessTokenExpiresAt: Date.now() - 1000,
        refreshTokenExpiresAt: Date.now() + 86400000,
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      // Mock network error
      server.use(
        http.post(MOCK_TOKEN_ENDPOINT, () => {
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

    it("should save new token data after successful refresh", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue(null);

      const tokenData: OidcTokenData = {
        accessToken: "expired-access-token",
        refreshToken: "valid-refresh-token",
        userId,
        accessTokenExpiresAt: Date.now() - 1000,
        refreshTokenExpiresAt: Date.now() + 86400000,
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      // Mock OIDC token endpoint
      server.use(
        http.post(MOCK_TOKEN_ENDPOINT, () => {
          return HttpResponse.json({
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
            expires_in: 3600,
            id_token: "new-id-token",
          });
        }),
      );

      const token = await getValidOidcToken(userId);

      expect(token).toBe("new-access-token");
      // Verify cookie was saved
      expect(mockCookies.set).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        "[Token] Refreshed successfully (cookie mode)",
      );
    });
  });

  describe("Token Refresh Edge Cases", () => {
    it("should return null if cookie data is not found", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue(null);
      mockCookies.get.mockReturnValue(undefined);

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
    });

    it("should return null if userId mismatch in cookie", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue(null);

      const tokenData: OidcTokenData = {
        accessToken: "expired-access-token",
        refreshToken: "valid-refresh-token",
        userId: "different-user",
        accessTokenExpiresAt: Date.now() - 1000,
        refreshTokenExpiresAt: Date.now() + 86400000,
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
    });

    it("should handle 500 errors from OIDC token endpoint", async () => {
      const userId = "user-123";
      mockGetOidcProviderAccessToken.mockResolvedValue(null);

      const tokenData: OidcTokenData = {
        accessToken: "expired-access-token",
        refreshToken: "valid-refresh-token",
        userId,
        accessTokenExpiresAt: Date.now() - 1000,
        refreshTokenExpiresAt: Date.now() + 86400000,
      };

      const encryptedPayload = await encrypt(
        tokenData,
        process.env.BETTER_AUTH_SECRET as string,
      );
      mockCookies.get.mockReturnValue({ value: encryptedPayload });

      server.use(
        http.post(MOCK_TOKEN_ENDPOINT, () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      const token = await getValidOidcToken(userId);

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Token] Refresh failed:",
        500,
      );
    });
  });
});
