import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const mockRefreshToken = vi.hoisted(() => vi.fn());
const mockSignOut = vi.hoisted(() => vi.fn());
const mockHeaders = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      refreshToken: mockRefreshToken,
      signOut: mockSignOut,
    },
  },
}));

const INTERNAL_URL = "http://0.0.0.0:3000/api/auth/token-refresh";

function makeRequest(path = INTERNAL_URL) {
  return new NextRequest(path);
}

function mockRefreshSuccess(cookies: string[] = []) {
  mockRefreshToken.mockResolvedValue({
    ok: true,
    status: 200,
    headers: { getSetCookie: () => cookies },
  });
}

function mockRefreshFailure(status = 400) {
  mockRefreshToken.mockResolvedValue({
    ok: false,
    status,
    headers: { getSetCookie: () => [] },
  });
}

function mockSignOutSuccess(cookies: string[] = []) {
  mockSignOut.mockResolvedValue({
    ok: true,
    status: 200,
    headers: { getSetCookie: () => cookies },
  });
}

describe("GET /api/auth/token-refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    // Default: signOut succeeds with no cookies (covers tests that don't care
    // about the cleanup path).
    mockSignOutSuccess();
  });

  describe("redirect URL uses BASE_URL, not request.url", () => {
    it("redirects to BASE_URL/catalog on success (not 0.0.0.0)", async () => {
      mockRefreshSuccess();
      const response = await GET(
        makeRequest(`${INTERNAL_URL}?redirect=%2Fcatalog`),
      );
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/catalog",
      );
    });

    it("redirects to BASE_URL/signin on token refresh failure", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      mockRefreshFailure();
      const response = await GET(makeRequest(INTERNAL_URL));
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/signin",
      );
    });

    it("redirects to BASE_URL/signin on unexpected error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockRefreshToken.mockRejectedValue(new Error("Network error"));
      const response = await GET(makeRequest(INTERNAL_URL));
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/signin",
      );
    });
  });

  describe("open redirect protection", () => {
    it("falls back to /catalog when no redirect param", async () => {
      mockRefreshSuccess();
      const response = await GET(makeRequest(INTERNAL_URL));
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/catalog",
      );
    });

    it("falls back to /catalog for redirect starting with //", async () => {
      mockRefreshSuccess();
      const response = await GET(
        makeRequest(`${INTERNAL_URL}?redirect=//evil.com`),
      );
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/catalog",
      );
    });

    it("falls back to /catalog for redirect to external origin", async () => {
      mockRefreshSuccess();
      const response = await GET(
        makeRequest(
          `${INTERNAL_URL}?redirect=${encodeURIComponent("https://evil.com/phishing")}`,
        ),
      );
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/catalog",
      );
    });

    it("accepts valid internal path with query string", async () => {
      mockRefreshSuccess();
      const response = await GET(
        makeRequest(
          `${INTERNAL_URL}?redirect=${encodeURIComponent("/catalog?page=2")}`,
        ),
      );
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/catalog?page=2",
      );
    });
  });

  describe("Set-Cookie forwarding", () => {
    it("copies Set-Cookie headers from Better Auth response onto the redirect", async () => {
      const cookie =
        "__Secure-better-auth.account_data=newvalue; Path=/; HttpOnly; SameSite=Lax";
      mockRefreshSuccess([cookie]);
      const response = await GET(
        makeRequest(`${INTERNAL_URL}?redirect=%2Fcatalog`),
      );
      expect(response.headers.get("set-cookie")).toBe(cookie);
    });

    it("forwards multiple Set-Cookie headers", async () => {
      const cookies = [
        "__Secure-better-auth.account_data=val1; Path=/; HttpOnly",
        "__Secure-better-auth.session_token=val2; Path=/; HttpOnly",
      ];
      mockRefreshSuccess(cookies);
      const response = await GET(
        makeRequest(`${INTERNAL_URL}?redirect=%2Fcatalog`),
      );
      const setCookieHeader = response.headers.getSetCookie();
      expect(setCookieHeader).toHaveLength(2);
      expect(setCookieHeader[0]).toBe(cookies[0]);
      expect(setCookieHeader[1]).toBe(cookies[1]);
    });
  });

  describe("cookie cleanup on failure", () => {
    it("forwards signOut Set-Cookie headers when refresh fails", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      mockRefreshFailure();
      const signOutCookies = [
        "__Secure-better-auth.session_token=; Path=/; Max-Age=0",
        "__Secure-better-auth.account_data=; Path=/; Max-Age=0",
      ];
      mockSignOutSuccess(signOutCookies);

      const response = await GET(makeRequest(INTERNAL_URL));

      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/signin",
      );
      const setCookieHeader = response.headers.getSetCookie();
      expect(setCookieHeader).toHaveLength(2);
      expect(setCookieHeader).toEqual(signOutCookies);
    });

    it("forwards signOut Set-Cookie headers when refresh throws", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockRefreshToken.mockRejectedValue(new Error("Network error"));
      const signOutCookies = [
        "__Secure-better-auth.session_token=; Path=/; Max-Age=0",
      ];
      mockSignOutSuccess(signOutCookies);

      const response = await GET(makeRequest(INTERNAL_URL));

      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/signin",
      );
      expect(response.headers.get("set-cookie")).toBe(signOutCookies[0]);
    });

    it("still redirects to /signin when signOut itself fails", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockRefreshFailure();
      mockSignOut.mockRejectedValue(new Error("signOut boom"));

      const response = await GET(makeRequest(INTERNAL_URL));

      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/signin",
      );
    });

    it("calls refreshToken with the configured providerId", async () => {
      mockRefreshSuccess();
      await GET(makeRequest(`${INTERNAL_URL}?redirect=%2Fcatalog`));
      expect(mockRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({ providerId: expect.any(String) }),
          asResponse: true,
        }),
      );
    });
  });

  describe("HTTP method parity", () => {
    it("POST handler behaves identically to GET (no 405 on Server Action 307 redirects)", async () => {
      mockRefreshSuccess();
      const response = await POST(
        makeRequest(`${INTERNAL_URL}?redirect=%2Fcatalog`),
      );
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/catalog",
      );
    });
  });
});
