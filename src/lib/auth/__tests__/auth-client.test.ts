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

  it("calls getOidcSignOutUrl, clearOidcTokenAction, redirect, and authClient.signOut", async () => {
    const oidcLogoutUrl = "https://okta.example.com/logout?id_token_hint=xxx";

    // Spy on server actions
    const getOidcSignOutUrlSpy = vi
      .spyOn(actions, "getOidcSignOutUrl")
      .mockResolvedValue(oidcLogoutUrl);
    const clearOidcTokenActionSpy = vi
      .spyOn(actions, "clearOidcTokenAction")
      .mockResolvedValue(undefined);
    mockAuthClientSignOut.mockResolvedValue(undefined);

    const { signOut } = await import("../auth-client");

    await signOut();

    // Verify all functions were called
    expect(getOidcSignOutUrlSpy).toHaveBeenCalledTimes(1);
    expect(clearOidcTokenActionSpy).toHaveBeenCalledTimes(1);
    expect(mockLocationReplace).toHaveBeenCalledWith(oidcLogoutUrl);
    expect(mockAuthClientSignOut).toHaveBeenCalledTimes(1);
  });

  it("calls functions in correct order", async () => {
    const callOrder: string[] = [];

    vi.spyOn(actions, "getOidcSignOutUrl").mockImplementation(async () => {
      callOrder.push("getOidcSignOutUrl");
      return "https://okta.example.com/logout";
    });

    vi.spyOn(actions, "clearOidcTokenAction").mockImplementation(async () => {
      callOrder.push("clearOidcTokenAction");
    });

    mockLocationReplace.mockImplementation(() => {
      callOrder.push("window.location.replace");
    });

    mockAuthClientSignOut.mockImplementation(async () => {
      callOrder.push("authClient.signOut");
    });

    const { signOut } = await import("../auth-client");

    await signOut();

    expect(callOrder).toEqual([
      "getOidcSignOutUrl",
      "clearOidcTokenAction",
      "window.location.replace",
      "authClient.signOut",
    ]);
  });

  it("redirects to /signin on error", async () => {
    vi.spyOn(actions, "getOidcSignOutUrl").mockRejectedValue(
      new Error("Network error"),
    );

    const { signOut } = await import("../auth-client");

    await signOut();

    expect(mockLocationReplace).toHaveBeenCalledWith("/signin");
  });

  it("uses /signin as fallback when no OIDC URL", async () => {
    vi.spyOn(actions, "getOidcSignOutUrl").mockResolvedValue("/signin");
    vi.spyOn(actions, "clearOidcTokenAction").mockResolvedValue(undefined);
    mockAuthClientSignOut.mockResolvedValue(undefined);

    const { signOut } = await import("../auth-client");

    await signOut();

    expect(mockLocationReplace).toHaveBeenCalledWith("/signin");
  });
});
