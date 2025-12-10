import { TextDecoder, TextEncoder } from "node:util";
import * as testingLibraryMatchers from "@testing-library/jest-dom/matchers";
import { expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

expect.extend(testingLibraryMatchers);

// Polyfill TextEncoder/TextDecoder for jsdom environment
// These are needed for jose encryption/decryption in tests
global.TextEncoder = TextEncoder;
// @ts-expect-error - TextDecoder types are compatible
global.TextDecoder = TextDecoder;

// Global mocks used across test files
vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// Global auth server mock with default authenticated session
// Uses importActual to preserve real exports (encrypt, decrypt, etc.) for unit tests
// Individual tests can override getSession return value if needed
vi.mock("@/lib/auth/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/auth")>();
  return {
    ...actual,
    auth: {
      ...actual.auth,
      api: {
        ...actual.auth.api,
        getSession: vi.fn(() =>
          Promise.resolve({
            user: {
              id: "mock-user-id",
              email: "test@example.com",
              name: "Test User",
            },
          }),
        ),
      },
    },
  };
});

// Common UI/runtime mocks
vi.mock("next/image", () => ({
  default: () => null,
}));

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

export const mockSetTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: mockSetTheme,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock OIDC token retrieval to return a test token by default
// This allows server action tests to bypass the full auth flow
vi.mock("@/lib/auth/token", () => ({
  getValidOidcToken: vi.fn(() => Promise.resolve("mock-test-token")),
}));

// Auth client baseline mock; individual tests can customize return values
vi.mock("@/lib/auth/auth-client", () => ({
  authClient: {
    signIn: {
      oauth2: vi.fn(),
    },
    signOut: vi.fn(),
  },
  signIn: {
    oauth2: vi.fn(),
  },
  signOut: vi.fn(),
  useSession: vi.fn(),
}));

import { cleanup } from "@testing-library/react";
// Reset mocks between test cases globally
import { afterEach } from "vitest";

afterEach(() => {
  // Clear calls/instances, but keep hoisted module mock implementations intact
  vi.clearAllMocks();
  // Clean up DOM after each test
  cleanup();
});
