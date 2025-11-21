import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import SignInPage from "@/app/signin/page";

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

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Toolhive/i,
      }),
    ).toBeDefined();

    expect(screen.getByRole("button", { name: /Okta/i })).toBeDefined();
  });

  test("calls authClient.signIn.oauth2 when button is clicked", async () => {
    const user = userEvent.setup();
    const { authClient } = await import("@/lib/auth/auth-client");
    vi.mocked(authClient.signIn.oauth2).mockResolvedValue({ error: null });

    render(<SignInPage />);

    const oktaButton = screen.getByRole("button", { name: /Okta/i });
    await user.click(oktaButton);

    await waitFor(() => {
      expect(authClient.signIn.oauth2).toHaveBeenCalledWith({
        providerId: "oidc",
        callbackURL: "/catalog",
        scope: "openid email profile offline_access",
      });
    });
  });

  test("shows error toast when signin fails with error", async () => {
    const user = userEvent.setup();
    const { toast } = await import("sonner");
    const { authClient } = await import("@/lib/auth/auth-client");

    vi.mocked(authClient.signIn.oauth2).mockResolvedValue({
      error: {
        message: "Invalid credentials",
      },
    });

    render(<SignInPage />);

    const oktaButton = screen.getByRole("button", { name: /Okta/i });
    await user.click(oktaButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Signin failed", {
        description: "Invalid credentials",
      });
    });
  });

  test("shows error toast when signin throws exception", async () => {
    const user = userEvent.setup();
    const { toast } = await import("sonner");
    const { authClient } = await import("@/lib/auth/auth-client");

    vi.mocked(authClient.signIn.oauth2).mockRejectedValue(
      new Error("Network error"),
    );

    render(<SignInPage />);

    const oktaButton = screen.getByRole("button", { name: /Okta/i });
    await user.click(oktaButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Signin error", {
        description: "Network error",
      });
    });
  });

  test("shows generic error message for unknown errors", async () => {
    const user = userEvent.setup();
    const { toast } = await import("sonner");
    const { authClient } = await import("@/lib/auth/auth-client");

    vi.mocked(authClient.signIn.oauth2).mockRejectedValue(
      "Something went wrong",
    );

    render(<SignInPage />);

    const oktaButton = screen.getByRole("button", { name: /Okta/i });
    await user.click(oktaButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Signin error", {
        description: "An unexpected error occurred",
      });
    });
  });
});
