import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorPage } from "./error-page-client";

describe("ErrorPage", () => {
  it("logs errors to console on mount", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const error = new Error("Test error");

    render(<ErrorPage error={error} reset={vi.fn()} />);

    expect(consoleError).toHaveBeenCalledWith(error);
    consoleError.mockRestore();
  });

  it("displays 'Something went wrong' title", () => {
    render(<ErrorPage error={new Error("Test")} reset={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: /something went wrong/i }),
    ).toBeInTheDocument();
  });

  it("displays error description", () => {
    render(<ErrorPage error={new Error("Test")} reset={vi.fn()} />);

    expect(
      screen.getByText(/an unexpected error occurred/i),
    ).toBeInTheDocument();
  });

  it("calls reset function when Try again button is clicked", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();

    render(<ErrorPage error={new Error("Test")} reset={reset} />);

    await user.click(screen.getByRole("button", { name: /try again/i }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("does not expose error message to user", () => {
    const error = new Error("Sensitive internal error details");

    render(<ErrorPage error={error} reset={vi.fn()} />);

    expect(
      screen.queryByText(/sensitive internal error/i),
    ).not.toBeInTheDocument();
  });
});
