import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/components/user-menu";
import { signOut } from "@/lib/auth/auth-client";

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

    // Open dropdown - use getAllByRole and find the one in this render
    const buttons = screen.getAllByRole("button");
    const trigger = buttons.find((btn) =>
      btn.textContent?.includes("Jane Smith"),
    );
    expect(trigger).toBeTruthy();
    if (!trigger) return;
    await user.click(trigger);

    // Find and click the sign out menu item (it's a div with role="menuitem")
    const signOutItem = screen.getByRole("menuitem", { name: /sign out/i });
    await user.click(signOutItem);

    // Verify signOut was called
    expect(signOut).toHaveBeenCalledOnce();
  });
});
