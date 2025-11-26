import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/components/user-menu";
import { signOut } from "@/lib/auth/auth-client";

const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: mockSetTheme,
  }),
}));

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

      expect(
        screen.getByRole("menuitemradio", { name: /light mode/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitemradio", { name: /dark mode/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitemradio", { name: /use system settings/i }),
      ).toBeInTheDocument();
    });

    it("calls setTheme with 'light' when light option is clicked", async () => {
      const userEvent = (await import("@testing-library/user-event")).default;
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      const lightOption = screen.getByRole("menuitemradio", {
        name: /light mode/i,
      });
      await user.click(lightOption);

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("calls setTheme with 'dark' when dark option is clicked", async () => {
      const userEvent = (await import("@testing-library/user-event")).default;
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      const darkOption = screen.getByRole("menuitemradio", {
        name: /dark mode/i,
      });
      await user.click(darkOption);

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("calls setTheme with 'system' when system option is clicked", async () => {
      const userEvent = (await import("@testing-library/user-event")).default;
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      const systemOption = screen.getByRole("menuitemradio", {
        name: /use system settings/i,
      });
      await user.click(systemOption);

      expect(mockSetTheme).toHaveBeenCalledWith("system");
    });

    it("shows the current theme as selected", async () => {
      const userEvent = (await import("@testing-library/user-event")).default;
      render(<UserMenu userName="Test User" />);
      const user = userEvent.setup();

      const trigger = screen.getByRole("button", { name: /test user/i });
      await user.click(trigger);

      const systemOption = screen.getByRole("menuitemradio", {
        name: /use system settings/i,
      });
      expect(systemOption).toHaveAttribute("aria-checked", "true");
    });
  });
});
