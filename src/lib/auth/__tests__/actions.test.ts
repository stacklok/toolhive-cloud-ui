import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.hoisted(() => vi.fn());
const mockGetAccessToken = vi.hoisted(() => vi.fn());
const mockGetOidcDiscovery = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
      getAccessToken: mockGetAccessToken,
    },
  },
  getOidcDiscovery: mockGetOidcDiscovery,
}));

vi.mock("@/lib/auth/constants", () => ({
  BASE_URL: "http://localhost:3000",
  OIDC_PROVIDER_ID: "oidc",
}));

import { getOidcSignOutUrl } from "../actions";

const MOCK_END_SESSION_ENDPOINT = "https://oidc.example.com/logout";
const MOCK_SESSION = { user: { id: "user-123", email: "test@example.com" } };

describe("getOidcSignOutUrl", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns /signin when no active session", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await getOidcSignOutUrl();

    expect(result).toBe("/signin");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[Auth] No active session for logout",
    );
  });

  it("returns /signin when discovery endpoint is unavailable", async () => {
    mockGetSession.mockResolvedValue(MOCK_SESSION);
    mockGetOidcDiscovery.mockResolvedValue(null);

    const result = await getOidcSignOutUrl();

    expect(result).toBe("/signin");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[Auth] OIDC end_session_endpoint not available",
    );
  });

  it("returns /signin when endSessionEndpoint is missing from discovery", async () => {
    mockGetSession.mockResolvedValue(MOCK_SESSION);
    mockGetOidcDiscovery.mockResolvedValue({ endSessionEndpoint: null });

    const result = await getOidcSignOutUrl();

    expect(result).toBe("/signin");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[Auth] OIDC end_session_endpoint not available",
    );
  });

  it("returns /signin when getAccessToken returns no idToken", async () => {
    mockGetSession.mockResolvedValue(MOCK_SESSION);
    mockGetOidcDiscovery.mockResolvedValue({
      endSessionEndpoint: MOCK_END_SESSION_ENDPOINT,
    });
    mockGetAccessToken.mockResolvedValue({ accessToken: "access-token" });

    const result = await getOidcSignOutUrl();

    expect(result).toBe("/signin");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[Auth] No idToken found for OIDC logout",
    );
  });

  it("returns /signin when getAccessToken returns null", async () => {
    mockGetSession.mockResolvedValue(MOCK_SESSION);
    mockGetOidcDiscovery.mockResolvedValue({
      endSessionEndpoint: MOCK_END_SESSION_ENDPOINT,
    });
    mockGetAccessToken.mockResolvedValue(null);

    const result = await getOidcSignOutUrl();

    expect(result).toBe("/signin");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "[Auth] No idToken found for OIDC logout",
    );
  });

  it("returns logout URL with id_token_hint and post_logout_redirect_uri", async () => {
    mockGetSession.mockResolvedValue(MOCK_SESSION);
    mockGetOidcDiscovery.mockResolvedValue({
      endSessionEndpoint: MOCK_END_SESSION_ENDPOINT,
    });
    mockGetAccessToken.mockResolvedValue({
      accessToken: "access-token",
      idToken: "id-token-123",
    });

    const result = await getOidcSignOutUrl();

    const url = new URL(result);
    expect(url.origin + url.pathname).toBe(MOCK_END_SESSION_ENDPOINT);
    expect(url.searchParams.get("id_token_hint")).toBe("id-token-123");
    expect(url.searchParams.get("post_logout_redirect_uri")).toBe(
      "http://localhost:3000/signin",
    );
  });

  it("passes OIDC_PROVIDER_ID to getAccessToken", async () => {
    mockGetSession.mockResolvedValue(MOCK_SESSION);
    mockGetOidcDiscovery.mockResolvedValue({
      endSessionEndpoint: MOCK_END_SESSION_ENDPOINT,
    });
    mockGetAccessToken.mockResolvedValue({
      accessToken: "access-token",
      idToken: "id-token-123",
    });

    await getOidcSignOutUrl();

    expect(mockGetAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({ body: { providerId: "oidc" } }),
    );
  });

  it("returns /signin on unexpected error", async () => {
    mockGetSession.mockRejectedValue(new Error("Network error"));

    const result = await getOidcSignOutUrl();

    expect(result).toBe("/signin");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[Auth] Error building OIDC logout URL:",
      expect.any(Error),
    );
  });
});
