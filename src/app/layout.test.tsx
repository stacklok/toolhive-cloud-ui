import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserMenu } from "@/components/user-menu";

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

  it("shows sign out option in dropdown menu when clicked", async () => {
    const userEvent = (await import("@testing-library/user-event")).default;
    const user = userEvent.setup();
    const { container } = render(<UserMenu userName="Test User" />);

    // Find and click the trigger (button with user name) within this render
    const trigger = container.querySelector("button");
    expect(trigger).toBeTruthy();
    if (!trigger) return;

    await user.click(trigger);

    // Check that sign out menu item appears
    const signOutItem = screen.getByText("Sign out");
    expect(signOutItem).toBeTruthy();
  });
});
