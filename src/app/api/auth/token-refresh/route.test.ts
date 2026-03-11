import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mockGetAccessToken = vi.hoisted(() => vi.fn());
const mockHeaders = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: { getAccessToken: mockGetAccessToken },
  },
}));

// BASE_URL defaults to "http://localhost:3000" in test (no BETTER_AUTH_URL set)

const INTERNAL_URL = "http://0.0.0.0:3000/api/auth/token-refresh";

function makeRequest(path = INTERNAL_URL) {
  return new NextRequest(path);
}

function mockTokenSuccess(cookies: string[] = []) {
  mockGetAccessToken.mockResolvedValue({
    ok: true,
    status: 200,
    headers: { getSetCookie: () => cookies },
  });
}

function mockTokenFailure(status = 401) {
  mockGetAccessToken.mockResolvedValue({
    ok: false,
    status,
    headers: { getSetCookie: () => [] },
  });
}

describe("GET /api/auth/token-refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
  });

  describe("redirect URL uses BASE_URL, not request.url", () => {
    it("redirects to BASE_URL/catalog on success (not 0.0.0.0)", async () => {
      mockTokenSuccess();
      const response = await GET(
        makeRequest(`${INTERNAL_URL}?redirect=%2Fcatalog`),
      );
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/catalog",
      );
    });

    it("redirects to BASE_URL/signin on token refresh failure", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      mockTokenFailure();
      const response = await GET(makeRequest(INTERNAL_URL));
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/signin",
      );
    });

    it("redirects to BASE_URL/signin on unexpected error", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockGetAccessToken.mockRejectedValue(new Error("Network error"));
      const response = await GET(makeRequest(INTERNAL_URL));
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/signin",
      );
    });
  });

  describe("open redirect protection", () => {
    it("falls back to /catalog when no redirect param", async () => {
      mockTokenSuccess();
      const response = await GET(makeRequest(INTERNAL_URL));
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/catalog",
      );
    });

    it("falls back to /catalog for redirect starting with //", async () => {
      mockTokenSuccess();
      const response = await GET(
        makeRequest(`${INTERNAL_URL}?redirect=//evil.com`),
      );
      expect(response.headers.get("location")).toBe(
        "http://localhost:3000/catalog",
      );
    });

    it("falls back to /catalog for redirect to external origin", async () => {
      mockTokenSuccess();
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
      mockTokenSuccess();
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
      mockTokenSuccess([cookie]);
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
      mockTokenSuccess(cookies);
      const response = await GET(
        makeRequest(`${INTERNAL_URL}?redirect=%2Fcatalog`),
      );
      const setCookieHeader = response.headers.getSetCookie();
      expect(setCookieHeader).toHaveLength(2);
      expect(setCookieHeader[0]).toBe(cookies[0]);
      expect(setCookieHeader[1]).toBe(cookies[1]);
    });
  });
});
