import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import Home from "../page";

// Mock Next.js modules
vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock auth module
vi.mock("@/lib/auth/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(() =>
        Promise.resolve({
          user: {
            email: "test@example.com",
            name: "Test User",
          },
        }),
      ),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("Home page renders welcome heading when user is logged in", async () => {
  render(await Home());

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: /Welcome to ToolHive Cloud UI/i,
    }),
  ).toBeDefined();

  expect(screen.getByText(/You are logged in as/i)).toBeDefined();
  expect(screen.getByText(/test@example.com/i)).toBeDefined();
});
