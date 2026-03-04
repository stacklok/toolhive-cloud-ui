import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Import after mocks
import { getUserInfoFromIdToken, getUserInfoFromTokens } from "../utils";

describe("utils", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getUserInfoFromIdToken", () => {
    // Helper to create a mock JWT
    const createMockJwt = (payload: object): string => {
      const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString(
        "base64",
      );
      const body = Buffer.from(JSON.stringify(payload)).toString("base64");
      return `${header}.${body}.signature`;
    };

    it("returns null when idToken is undefined", () => {
      const result = getUserInfoFromIdToken(undefined);
      expect(result).toBeNull();
    });

    it("returns null for invalid JWT format", () => {
      const result = getUserInfoFromIdToken("not-a-jwt");
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Auth] Invalid JWT format: expected 3 parts",
      );
    });

    it("extracts standard OIDC claims", () => {
      const jwt = createMockJwt({
        sub: "user-123",
        email: "user@example.com",
        name: "Test User",
        picture: "https://example.com/avatar.jpg",
        email_verified: true,
      });

      const result = getUserInfoFromIdToken(jwt);

      expect(result).toEqual({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        image: "https://example.com/avatar.jpg",
        emailVerified: true,
      });
    });

    it("handles Azure AD claims (preferred_username)", () => {
      const jwt = createMockJwt({
        oid: "azure-oid",
        preferred_username: "azure@example.com",
        given_name: "Azure User",
      });

      const result = getUserInfoFromIdToken(jwt);

      expect(result).toEqual({
        id: "azure-oid",
        email: "azure@example.com",
        name: "Azure User",
        image: undefined,
        emailVerified: false,
      });
    });

    it("returns null and logs error on malformed payload", () => {
      const result = getUserInfoFromIdToken("header.not-valid-base64.sig");
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[Auth] Failed to decode ID token:",
        expect.any(Error),
      );
    });
  });

  describe("getUserInfoFromTokens", () => {
    const mockDiscoveryUrl =
      "https://oidc.example.com/.well-known/openid-configuration";

    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns user info from ID token when available", async () => {
      const jwt =
        Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64") +
        "." +
        Buffer.from(
          JSON.stringify({
            sub: "user-123",
            email: "user@example.com",
            name: "Test User",
          }),
        ).toString("base64") +
        ".signature";

      const result = await getUserInfoFromTokens(
        { idToken: jwt, accessToken: "access-token" },
        mockDiscoveryUrl,
      );

      expect(result).toEqual({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        image: undefined,
        emailVerified: false,
      });
      // Should not call fetch since ID token has email
      expect(fetch).not.toHaveBeenCalled();
    });

    it("falls back to userinfo endpoint when ID token has no email", async () => {
      const jwt =
        Buffer.from(JSON.stringify({ alg: "RS256" })).toString("base64") +
        "." +
        Buffer.from(JSON.stringify({ sub: "user-123" })).toString("base64") +
        ".signature";

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              userinfo_endpoint: "https://oidc.example.com/userinfo",
            }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              sub: "user-123",
              email: "user@example.com",
              name: "Test User",
            }),
        } as Response);

      const result = await getUserInfoFromTokens(
        { idToken: jwt, accessToken: "access-token" },
        mockDiscoveryUrl,
      );

      expect(result).toEqual({
        id: "user-123",
        email: "user@example.com",
        name: "Test User",
        image: undefined,
        emailVerified: false,
      });
    });

    it("returns null when both ID token and userinfo fail", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await getUserInfoFromTokens(
        { accessToken: "access-token" },
        mockDiscoveryUrl,
      );

      expect(result).toBeNull();
    });

    it("returns null when no access token for userinfo", async () => {
      const result = await getUserInfoFromTokens({}, mockDiscoveryUrl);
      expect(result).toBeNull();
    });
  });
});
