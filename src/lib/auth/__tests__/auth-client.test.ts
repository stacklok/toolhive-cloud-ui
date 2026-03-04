import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearRecordedRequests, server } from "@/mocks/node";

// Remove global mock of auth-client from vitest.setup.ts
vi.unmock("@/lib/auth/auth-client");

// Import after mocks are defined (vi.mock is hoisted)
import { signOut } from "../auth-client";

// Hoist mocks
const mockAuthClientSignOut = vi.hoisted(() => vi.fn());
const mockLocationReplace = vi.hoisted(() => vi.fn());
const mockGetOidcSignOutUrl = vi.hoisted(() => vi.fn<() => Promise<string>>());

// Mock Better Auth client
vi.mock("better-auth/client/plugins", () => ({
  genericOAuthClient: vi.fn(() => ({})),
}));

vi.mock("better-auth/react", () => ({
  createAuthClient: vi.fn(() => ({
    signIn: vi.fn(),
    useSession: vi.fn(),
    signOut: mockAuthClientSignOut,
  })),
}));

vi.mock("../actions", () => ({
  getOidcSignOutUrl: mockGetOidcSignOutUrl,
}));

// Mock window.location globally
Object.defineProperty(globalThis, "window", {
  value: {
    location: {
      replace: mockLocationReplace,
    },
  },
  writable: true,
  configurable: true,
});

describe("signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRecordedRequests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    server.resetHandlers();
  });

  it("calls getOidcSignOutUrl, authClient.signOut, and redirects", async () => {
    const oidcLogoutUrl = "https://okta.example.com/logout?id_token_hint=xxx";

    mockGetOidcSignOutUrl.mockResolvedValue(oidcLogoutUrl);
    mockAuthClientSignOut.mockResolvedValue(undefined);

    await signOut();

    // Verify all functions were called
    expect(mockGetOidcSignOutUrl).toHaveBeenCalledTimes(1);
    expect(mockAuthClientSignOut).toHaveBeenCalledTimes(1);
    expect(mockLocationReplace).toHaveBeenCalledWith(oidcLogoutUrl);
  });

  it("calls functions in correct order", async () => {
    const callOrder: string[] = [];

    mockGetOidcSignOutUrl.mockImplementation(async () => {
      callOrder.push("getOidcSignOutUrl");
      return "https://okta.example.com/logout";
    });

    mockAuthClientSignOut.mockImplementation(async () => {
      callOrder.push("authClient.signOut");
    });

    mockLocationReplace.mockImplementation(() => {
      callOrder.push("window.location.replace");
    });

    await signOut();

    // Order: get URL first (while session still exists), then sign out, then redirect.
    expect(callOrder).toEqual([
      "getOidcSignOutUrl",
      "authClient.signOut",
      "window.location.replace",
    ]);
  });

  it("redirects to /signin on error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockGetOidcSignOutUrl.mockRejectedValue(new Error("Network error"));

    await signOut();

    expect(mockLocationReplace).toHaveBeenCalledWith("/signin");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[Auth] Sign out error:",
      expect.any(Error),
    );
  });

  it("uses /signin as fallback when no OIDC URL", async () => {
    mockGetOidcSignOutUrl.mockResolvedValue("/signin");
    mockAuthClientSignOut.mockResolvedValue(undefined);

    await signOut();

    expect(mockLocationReplace).toHaveBeenCalledWith("/signin");
  });
});
