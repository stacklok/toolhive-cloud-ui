import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "./not-found";

describe("NotFound", () => {
  it("displays the server not found heading", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { name: /server not found/i }),
    ).toBeVisible();
  });

  it("displays a descriptive message", () => {
    render(<NotFound />);

    expect(
      screen.getByText(/doesn't exist or has been removed/i),
    ).toBeVisible();
  });

  it("has a link to browse the catalog", () => {
    render(<NotFound />);

    const link = screen.getByRole("link", { name: /browse catalog/i });
    expect(link).toHaveAttribute("href", "/catalog");
  });

  it("has a back button", () => {
    render(<NotFound />);

    expect(screen.getByRole("button", { name: /back/i })).toBeVisible();
  });

  it("displays a decorative illustration", () => {
    const { container } = render(<NotFound />);

    const svg = container.querySelector("svg[aria-hidden='true']");
    expect(svg).toBeVisible();
  });
});
