import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      expect(screen.getByText("Theme")).toBeInTheDocument();
    });

    it("displays light, dark, and system theme options", async () => {
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      expect(screen.getByText(/light mode/i)).toBeInTheDocument();
      expect(screen.getByText(/dark mode/i)).toBeInTheDocument();
      expect(screen.getByText(/use system settings/i)).toBeInTheDocument();
    });

    it.each([
      { theme: "light", label: /light mode/i },
      { theme: "dark", label: /dark mode/i },
      { theme: "system", label: /use system settings/i },
    ])("calls setTheme with '$theme' when $theme option is clicked", async ({
      theme,
      label,
    }) => {
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      const option = screen.getByText(label);
      await user.click(option);

      expect(mockSetTheme).toHaveBeenCalledWith(theme);
    });
  });
});
