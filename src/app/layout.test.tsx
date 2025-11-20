import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserMenu } from "@/components/user-menu";

describe("UserMenu", () => {
  it.each([
    { userName: "Test User" },
    { userName: "Jane Doe" },
    { userName: "Alice Smith" },
  ])("displays user name '$userName'", ({ userName }) => {
    render(<UserMenu userName={userName} />);

    const userElement = screen.getByText(userName);
    expect(userElement).toBeTruthy();
  });
});
