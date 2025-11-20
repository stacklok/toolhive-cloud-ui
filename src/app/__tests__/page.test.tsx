import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "../page";

test("Home page renders welcome heading and link to catalog when user is logged in", async () => {
  render(await Home());

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: /Welcome to ToolHive Cloud UI/i,
    }),
  ).toBeDefined();

  expect(screen.getByText(/You are logged in as/i)).toBeDefined();
  expect(screen.getByText(/test@example.com/i)).toBeDefined();

  const catalogLink = screen.getByRole("link", { name: /Go to Catalog/i });
  expect(catalogLink).toBeDefined();
  expect(catalogLink.getAttribute("href")).toBe("/catalog");
});
