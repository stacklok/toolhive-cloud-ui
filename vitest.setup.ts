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

// Note: Do not globally mock the entire auth module; unit tests under src/lib/auth
// validate real exports like encrypt/decrypt. Mock getSession per test instead.

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
  // Clear calls/instances, but keep hoisted module mock implementations intact
  vi.clearAllMocks();
});
