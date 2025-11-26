import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorPage } from "./error-page";

describe("ErrorPage", () => {
  it("displays the title", () => {
    render(<ErrorPage title="Test Error">Error description</ErrorPage>);

    expect(
      screen.getByRole("heading", { name: /test error/i }),
    ).toBeInTheDocument();
  });

  it("displays children as description", () => {
    render(<ErrorPage title="Error">This is the error message</ErrorPage>);

    expect(screen.getByText(/this is the error message/i)).toBeInTheDocument();
  });

  it("displays action buttons when provided", () => {
    render(
      <ErrorPage
        title="Error"
        actions={<button type="button">Click me</button>}
      >
        Description
      </ErrorPage>,
    );

    expect(
      screen.getByRole("button", { name: /click me/i }),
    ).toBeInTheDocument();
  });

  it("displays a decorative illustration", () => {
    const { container } = render(
      <ErrorPage title="Error">Description</ErrorPage>,
    );

    const svg = container.querySelector("svg[aria-hidden='true']");
    expect(svg).toBeInTheDocument();
  });
});
