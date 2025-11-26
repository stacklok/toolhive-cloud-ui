import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserMenu } from "@/components/user-menu";
import { signOut } from "@/lib/auth/auth-client";
import { mockSetTheme } from "../../../vitest.setup";

describe("UserMenu", () => {
  it.each([
    { userName: "Test User", expectedInitials: "TU" },
    { userName: "Jane Doe", expectedInitials: "JD" },
    { userName: "Alice Smith", expectedInitials: "AS" },
  ])("displays user name '$userName' with initials '$expectedInitials'", ({
    userName,
    expectedInitials,
  }) => {
    render(<UserMenu userName={userName} />);

    const userElement = screen.getByText(userName);
    expect(userElement).toBeTruthy();

    const initialsElement = screen.getByText(expectedInitials);
    expect(initialsElement).toBeTruthy();
  });

  it("calls signOut when sign out menu item is clicked", async () => {
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<UserMenu userName="Jane Smith" />);
    const user = userEvent.setup();

    const buttons = screen.getAllByRole("button");
    const trigger = buttons.find((btn) =>
      btn.textContent?.includes("Jane Smith"),
    );
    expect(trigger).toBeTruthy();
    if (!trigger) return;
    await user.click(trigger);

    const signOutItem = screen.getByRole("menuitem", { name: /sign out/i });
    await user.click(signOutItem);

    expect(signOut).toHaveBeenCalledOnce();
  });

  describe("theme selection", () => {
    it("displays theme section with label", async () => {
      const userEvent = (await import("@testing-library/user-event")).default;
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      expect(screen.getByText("Theme")).toBeInTheDocument();
    });

    it("displays light, dark, and system theme options", async () => {
      const userEvent = (await import("@testing-library/user-event")).default;
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      expect(screen.getByText(/light mode/i)).toBeInTheDocument();
      expect(screen.getByText(/dark mode/i)).toBeInTheDocument();
      expect(screen.getByText(/use system settings/i)).toBeInTheDocument();
    });

    it("calls setTheme with 'light' when light option is clicked", async () => {
      const userEvent = (await import("@testing-library/user-event")).default;
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      const lightOption = screen.getByText(/light mode/i);
      await user.click(lightOption);

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("calls setTheme with 'dark' when dark option is clicked", async () => {
      const userEvent = (await import("@testing-library/user-event")).default;
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      const darkOption = screen.getByText(/dark mode/i);
      await user.click(darkOption);

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("calls setTheme with 'system' when system option is clicked", async () => {
      const userEvent = (await import("@testing-library/user-event")).default;
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      const systemOption = screen.getByText(/use system settings/i);
      await user.click(systemOption);

      expect(mockSetTheme).toHaveBeenCalledWith("system");
    });

    it("shows checkmark on the current theme", async () => {
      const userEvent = (await import("@testing-library/user-event")).default;
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      // The mock returns "system" as the current theme
      const systemMenuItem = screen
        .getByText(/use system settings/i)
        .closest('[data-slot="dropdown-menu-item"]');
      expect(systemMenuItem).toBeInTheDocument();
      // Check that there's a check icon (lucide adds the class "lucide-check")
      const checkIcon = systemMenuItem?.querySelector(".lucide-check");
      expect(checkIcon).toBeInTheDocument();
    });
  });
});
