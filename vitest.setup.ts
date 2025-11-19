import { TextDecoder, TextEncoder } from "node:util";
import { vi } from "vitest";

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
}));

// Partially mock auth only for getSession; keep other exports (encrypt, decrypt, etc.) intact
vi.mock("@/lib/auth/auth", async (importOriginal) => {
  const actual = (await importOriginal()) as unknown as {
    auth: { api: { getSession: (...args: unknown[]) => unknown } };
    [k: string]: unknown;
  };
  return {
    ...actual,
    auth: {
      ...actual.auth,
      api: {
        ...actual.auth.api,
        getSession: vi.fn(() =>
          Promise.resolve({
            user: { email: "test@example.com", name: "Test User" },
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
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Auth client baseline mock; individual tests can customize return values
vi.mock("@/lib/auth/auth-client", () => ({
  authClient: {
    signIn: {
      oauth2: vi.fn(),
    },
    signOut: vi.fn(),
  },
}));

// Reset mocks between test cases globally
import { afterEach } from "vitest";

afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});
