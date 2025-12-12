import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotFound from "./not-found";

vi.mock("@/components/navbar", () => ({
  Navbar: () => <header data-testid="navbar">Navbar</header>,
}));

describe("NotFound (root)", () => {
  it("displays a page not found heading", async () => {
    render(await NotFound());

    expect(
      screen.getByRole("heading", { name: /page not found/i }),
    ).toBeVisible();
  });

  it("displays a generic error message", async () => {
    render(await NotFound());

    expect(
      screen.getByText(/the page you're looking for doesn't exist/i),
    ).toBeVisible();
  });

  it("has a link to browse the catalog", async () => {
    render(await NotFound());

    const link = screen.getByRole("link", { name: /browse catalog/i });
    expect(link).toHaveAttribute("href", "/catalog");
  });

  it("does not have a back button", async () => {
    render(await NotFound());

    expect(
      screen.queryByRole("button", { name: /back/i }),
    ).not.toBeInTheDocument();
  });

  it("displays a decorative illustration", async () => {
    const { container } = render(await NotFound());

    const svg = container.querySelector("svg[aria-hidden='true']");
    expect(svg).toBeVisible();
  });

  it("displays the navbar", async () => {
    render(await NotFound());

    expect(screen.getByTestId("navbar")).toBeVisible();
  });
});
