import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks — must be defined before any imports
const mockRedirect = vi.hoisted(() => vi.fn());
const mockGetSession = vi.hoisted(() => vi.fn());
const mockGetAccessToken = vi.hoisted(() => vi.fn());
const mockIsTokenNearExpiry = vi.hoisted(() => vi.fn());
const mockIsDatabaseMode = vi.hoisted(() => ({ isDatabaseMode: false }));

vi.mock("next/navigation", () => ({ redirect: mockRedirect }));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers({ "x-url": "/catalog" }))),
  cookies: vi.fn(() =>
    Promise.resolve({ get: vi.fn(), getAll: vi.fn(() => []) }),
  ),
}));

vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: { getSession: mockGetSession, getAccessToken: mockGetAccessToken },
  },
}));

vi.mock("@/lib/auth/constants", () => ({
  OIDC_PROVIDER_ID: "oidc",
}));

vi.mock("@/lib/auth/db", () => mockIsDatabaseMode);

vi.mock("@/lib/auth/utils", () => ({
  isTokenNearExpiry: mockIsTokenNearExpiry,
}));

vi.mock("@/generated/client", () => ({
  createClient: vi.fn(() => ({})),
  createConfig: vi.fn(() => ({})),
}));

vi.mock("@/generated/sdk.gen", () => ({}));

import { getAuthenticatedClient } from "./api-client";

const MOCK_SESSION = { user: { id: "user-123" } };
const MOCK_ACCESS_TOKEN = "mock-access-token";

describe("getAuthenticatedClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue(MOCK_SESSION);
    mockGetAccessToken.mockResolvedValue({ accessToken: MOCK_ACCESS_TOKEN });
    mockIsTokenNearExpiry.mockResolvedValue(false);
    mockIsDatabaseMode.isDatabaseMode = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("database mode", () => {
    it("skips isTokenNearExpiry check and never redirects to token-refresh", async () => {
      mockIsDatabaseMode.isDatabaseMode = true;

      await getAuthenticatedClient();

      expect(mockIsTokenNearExpiry).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalledWith(
        expect.stringContaining("token-refresh"),
      );
    });

    it("proceeds to return the API client", async () => {
      mockIsDatabaseMode.isDatabaseMode = true;

      const client = await getAuthenticatedClient();

      expect(client).toBeDefined();
    });
  });

  describe("cookie mode", () => {
    it("redirects to token-refresh when token is near expiry", async () => {
      mockIsDatabaseMode.isDatabaseMode = false;
      mockIsTokenNearExpiry.mockResolvedValue(true);

      await getAuthenticatedClient();

      expect(mockRedirect).toHaveBeenCalledWith(
        "/api/auth/token-refresh?redirect=%2Fcatalog",
      );
    });

    it("does not redirect when token is fresh", async () => {
      mockIsDatabaseMode.isDatabaseMode = false;
      mockIsTokenNearExpiry.mockResolvedValue(false);

      await getAuthenticatedClient();

      expect(mockRedirect).not.toHaveBeenCalledWith(
        expect.stringContaining("token-refresh"),
      );
    });
  });

  it("redirects to /signin when no session", async () => {
    mockGetSession.mockResolvedValue(null);

    await getAuthenticatedClient();

    expect(mockRedirect).toHaveBeenCalledWith("/signin");
  });
});
