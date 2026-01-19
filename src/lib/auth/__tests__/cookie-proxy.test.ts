import type { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OidcTokenData } from "../types";

// Mock constants
vi.mock("../constants", () => ({
  BETTER_AUTH_SECRET: "test-secret-key-for-testing-purposes",
  COOKIE_SECURE: false,
  OIDC_TOKEN_COOKIE_NAME: "oidc_token",
  TOKEN_SEVEN_DAYS_SECONDS: 604800,
}));

// Mock crypto module for encryption tests
const mockEncrypt = vi.fn();
const mockDecrypt = vi.fn();

vi.mock("../crypto", () => ({
  encrypt: (data: OidcTokenData, _secret: string) => mockEncrypt(data),
  decrypt: (jwe: string, _secret: string) => mockDecrypt(jwe),
}));

// Import after mocks
const {
  readTokenFromRequest,
  setTokenCookiesOnResponse,
  clearTokenCookiesOnResponse,
  decryptTokenData,
  encryptTokenData,
} = await import("../cookie");

// Helper to create mock NextRequest
function createMockRequest(
  cookies: Array<{ name: string; value: string }>,
): NextRequest {
  const cookieMap = new Map(cookies.map((c) => [c.name, c]));
  return {
    cookies: {
      get: (name: string) => cookieMap.get(name),
      getAll: () => cookies,
    },
  } as unknown as NextRequest;
}

// Helper to create mock NextResponse with cookie tracking
function createMockResponse(): NextResponse & {
  _cookies: Map<string, { value: string; deleted?: boolean }>;
} {
  const cookieStore = new Map<string, { value: string; deleted?: boolean }>();
  return {
    cookies: {
      set: (
        name: string,
        value: string,
        _options?: Record<string, unknown>,
      ) => {
        cookieStore.set(name, { value });
      },
      delete: (name: string) => {
        cookieStore.set(name, { value: "", deleted: true });
      },
    },
    _cookies: cookieStore,
  } as unknown as NextResponse & {
    _cookies: Map<string, { value: string; deleted?: boolean }>;
  };
}

describe("cookie proxy functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("readTokenFromRequest", () => {
    it("should return null when no token cookie exists", () => {
      const request = createMockRequest([]);

      const result = readTokenFromRequest(request);

      expect(result).toBeNull();
    });

    it("should return single cookie value", () => {
      const request = createMockRequest([
        { name: "oidc_token", value: "encrypted-token-value" },
      ]);

      const result = readTokenFromRequest(request);

      expect(result).toBe("encrypted-token-value");
    });

    it("should reassemble chunked cookies in order", () => {
      const request = createMockRequest([
        { name: "oidc_token.0", value: "chunk0" },
        { name: "oidc_token.2", value: "chunk2" },
        { name: "oidc_token.1", value: "chunk1" },
      ]);

      const result = readTokenFromRequest(request);

      expect(result).toBe("chunk0chunk1chunk2");
    });

    it("should prefer single cookie over chunked cookies", () => {
      const request = createMockRequest([
        { name: "oidc_token", value: "single-value" },
        { name: "oidc_token.0", value: "chunk0" },
      ]);

      const result = readTokenFromRequest(request);

      expect(result).toBe("single-value");
    });

    it("should handle many chunks correctly", () => {
      const chunks = Array.from({ length: 10 }, (_, i) => ({
        name: `oidc_token.${i}`,
        value: `part${i}`,
      }));
      const request = createMockRequest(chunks);

      const result = readTokenFromRequest(request);

      expect(result).toBe("part0part1part2part3part4part5part6part7part8part9");
    });
  });

  describe("setTokenCookiesOnResponse", () => {
    it("should set single cookie for small tokens", () => {
      const response = createMockResponse();
      const encrypted = "short-encrypted-token";

      setTokenCookiesOnResponse(response, encrypted);

      expect(response._cookies.get("oidc_token")?.value).toBe(encrypted);
      expect(response._cookies.size).toBe(1);
    });

    it("should chunk large tokens across multiple cookies", () => {
      const response = createMockResponse();
      // Create a string larger than CHUNK_SIZE (4096 - 200 = 3896)
      const encrypted = "x".repeat(8000);

      setTokenCookiesOnResponse(response, encrypted);

      // Should have 3 chunks (8000 / 3896 ≈ 2.05, so 3 chunks)
      expect(response._cookies.has("oidc_token.0")).toBe(true);
      expect(response._cookies.has("oidc_token.1")).toBe(true);
      expect(response._cookies.has("oidc_token.2")).toBe(true);
      expect(response._cookies.has("oidc_token")).toBe(false);
    });
  });

  describe("clearTokenCookiesOnResponse", () => {
    it("should delete main cookie", () => {
      const request = createMockRequest([
        { name: "oidc_token", value: "token" },
      ]);
      const response = createMockResponse();

      clearTokenCookiesOnResponse(response, request);

      expect(response._cookies.get("oidc_token")?.deleted).toBe(true);
    });

    it("should delete all chunked cookies", () => {
      const request = createMockRequest([
        { name: "oidc_token.0", value: "chunk0" },
        { name: "oidc_token.1", value: "chunk1" },
        { name: "oidc_token.2", value: "chunk2" },
        { name: "other_cookie", value: "other" },
      ]);
      const response = createMockResponse();

      clearTokenCookiesOnResponse(response, request);

      expect(response._cookies.get("oidc_token")?.deleted).toBe(true);
      expect(response._cookies.get("oidc_token.0")?.deleted).toBe(true);
      expect(response._cookies.get("oidc_token.1")?.deleted).toBe(true);
      expect(response._cookies.get("oidc_token.2")?.deleted).toBe(true);
      expect(response._cookies.has("other_cookie")).toBe(false);
    });
  });

  describe("encryptTokenData and decryptTokenData", () => {
    it("should call encrypt with token data", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
        accessTokenExpiresAt: Date.now() + 3600000,
        refreshTokenExpiresAt: Date.now() + 86400000,
        userId: "user-123",
        idToken: "id-token-789",
      };

      mockEncrypt.mockResolvedValue("encrypted-jwe-string");

      const encrypted = await encryptTokenData(tokenData);

      expect(mockEncrypt).toHaveBeenCalledWith(tokenData);
      expect(encrypted).toBe("encrypted-jwe-string");
    });

    it("should call decrypt and return token data", async () => {
      const tokenData: OidcTokenData = {
        accessToken: "access-token-123",
        accessTokenExpiresAt: Date.now() + 3600000,
        userId: "user-123",
      };

      mockDecrypt.mockResolvedValue(tokenData);

      const result = await decryptTokenData("encrypted-jwe");

      expect(mockDecrypt).toHaveBeenCalledWith("encrypted-jwe");
      expect(result).toEqual(tokenData);
    });

    it("should return null when decrypt throws an error", async () => {
      mockDecrypt.mockRejectedValue(new Error("Decryption failed"));

      const result = await decryptTokenData("invalid-jwe");

      expect(result).toBeNull();
    });
  });
});
