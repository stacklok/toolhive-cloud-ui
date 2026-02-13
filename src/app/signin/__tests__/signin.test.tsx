import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import SignInPage from "@/app/signin/page";
import { SignInButton } from "@/app/signin/signin-button";
import { authClient } from "@/lib/auth/auth-client";

describe("SignInPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders signin page with all elements", () => {
    render(<SignInPage />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /Sign in/i,
      }),
    ).toBeDefined();

    expect(
      screen.getByText(/Sign in using your company credentials/i),
    ).toBeDefined();

    expect(screen.getByRole("button", { name: /Oidc/i })).toBeDefined();
  });

  test("calls authClient.signIn.oauth2 when button is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signIn.oauth2).mockResolvedValue({
      data: { url: "http://example.com", redirect: true },
      error: null,
    });

    render(<SignInPage />);

    const signInButton = screen.getByRole("button", { name: /Oidc/i });
    await user.click(signInButton);

    await waitFor(() => {
      expect(authClient.signIn.oauth2).toHaveBeenCalledWith({
        providerId: "oidc",
        callbackURL: "/catalog",
      });
    });
  });

  test("shows error toast when signin fails with error", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signIn.oauth2).mockResolvedValue({
      error: {
        message: "Invalid credentials",
      },
    } as Awaited<ReturnType<typeof authClient.signIn.oauth2>>);

    render(<SignInPage />);

    const signInButton = screen.getByRole("button", { name: /Oidc/i });
    await user.click(signInButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Signin failed", {
        description: "Invalid credentials",
      });
    });
  });

  test("shows error toast when signin throws exception", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signIn.oauth2).mockRejectedValue(
      new Error("Network error"),
    );

    render(<SignInPage />);

    const signInButton = screen.getByRole("button", { name: /Oidc/i });
    await user.click(signInButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Signin error", {
        description: "Network error",
      });
    });
  });

  test("shows generic error message for unknown errors", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signIn.oauth2).mockRejectedValue(
      "Something went wrong",
    );

    render(<SignInPage />);

    const signInButton = screen.getByRole("button", { name: /Oidc/i });
    await user.click(signInButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Signin error", {
        description: "An unexpected error occurred",
      });
    });
  });

  test("signin with okta provider", async () => {
    const user = userEvent.setup();
    vi.mocked(authClient.signIn.oauth2).mockResolvedValue({
      data: { url: "http://example.com", redirect: true },
      error: null,
    });

    render(<SignInButton providerId="okta" />);

    expect(screen.getByRole("button", { name: "Okta" })).toBeDefined();

    const oktaButton = screen.getByRole("button", { name: /Okta/i });
    await user.click(oktaButton);

    await waitFor(() => {
      expect(authClient.signIn.oauth2).toHaveBeenCalledWith({
        providerId: "okta",
        callbackURL: "/catalog",
      });
    });
  });
});
