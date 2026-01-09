import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearRecordedRequests, server } from "@/mocks/node";
import * as actions from "../actions";

// Remove global mock of auth-client from vitest.setup.ts
vi.unmock("@/lib/auth/auth-client");

// Hoist mocks
const mockAuthClientSignOut = vi.hoisted(() => vi.fn());
const mockLocationReplace = vi.hoisted(() => vi.fn());

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

    // Spy on server actions
    const getOidcSignOutUrlSpy = vi
      .spyOn(actions, "getOidcSignOutUrl")
      .mockResolvedValue(oidcLogoutUrl);
    mockAuthClientSignOut.mockResolvedValue(undefined);

    const { signOut } = await import("../auth-client");

    await signOut();

    // Verify all functions were called
    expect(getOidcSignOutUrlSpy).toHaveBeenCalledTimes(1);
    expect(mockAuthClientSignOut).toHaveBeenCalledTimes(1);
    expect(mockLocationReplace).toHaveBeenCalledWith(oidcLogoutUrl);
  });

  it("calls functions in correct order", async () => {
    const callOrder: string[] = [];

    vi.spyOn(actions, "getOidcSignOutUrl").mockImplementation(async () => {
      callOrder.push("getOidcSignOutUrl");
      return "https://okta.example.com/logout";
    });

    mockAuthClientSignOut.mockImplementation(async () => {
      callOrder.push("authClient.signOut");
    });

    mockLocationReplace.mockImplementation(() => {
      callOrder.push("window.location.replace");
    });

    const { signOut } = await import("../auth-client");

    await signOut();

    // Order: get URL first, then sign out from Better Auth, then redirect to OIDC
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

    vi.spyOn(actions, "getOidcSignOutUrl").mockRejectedValue(
      new Error("Network error"),
    );

    const { signOut } = await import("../auth-client");

    await signOut();

    expect(mockLocationReplace).toHaveBeenCalledWith("/signin");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[Auth] Sign out error:",
      expect.any(Error),
    );
  });

  it("uses /signin as fallback when no OIDC URL", async () => {
    vi.spyOn(actions, "getOidcSignOutUrl").mockResolvedValue("/signin");
    mockAuthClientSignOut.mockResolvedValue(undefined);

    const { signOut } = await import("../auth-client");

    await signOut();

    expect(mockLocationReplace).toHaveBeenCalledWith("/signin");
  });
});
