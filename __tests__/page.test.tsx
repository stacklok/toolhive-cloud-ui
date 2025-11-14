import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "../src/app/page";

test("Home page renders welcome heading", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", {
      level: 1,
      name: /Welcome to ToolHive Cloud UI/i,
    }),
  ).toBeDefined();
});
