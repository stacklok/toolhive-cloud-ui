import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import Home from "../page";

beforeEach(() => vi.clearAllMocks());

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
