import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ServerFilters } from "../server-filters";

describe("ServerFilters", () => {
  const defaultProps = {
    viewMode: "grid" as const,
    onViewModeChange: vi.fn(),
    searchQuery: "",
    onSearchChange: vi.fn(),
  };

  it("calls onViewModeChange when list button is clicked", async () => {
    const user = userEvent.setup();
    const onViewModeChange = vi.fn();

    render(
      <ServerFilters {...defaultProps} onViewModeChange={onViewModeChange} />,
    );

    await user.click(screen.getByLabelText("List view"));

    expect(onViewModeChange).toHaveBeenCalledWith("list");
  });

  it("calls onViewModeChange when grid button is clicked", async () => {
    const user = userEvent.setup();
    const onViewModeChange = vi.fn();

    render(
      <ServerFilters {...defaultProps} onViewModeChange={onViewModeChange} />,
    );

    await user.click(screen.getByLabelText("Grid view"));

    expect(onViewModeChange).toHaveBeenCalledWith("grid");
  });

  it("calls onSearchChange when typing in search input", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    render(<ServerFilters {...defaultProps} onSearchChange={onSearchChange} />);

    const searchInput = screen.getByPlaceholderText("Search");
    await user.type(searchInput, "test");

    expect(onSearchChange).toHaveBeenCalled();
  });

  it("displays search query value", () => {
    render(<ServerFilters {...defaultProps} searchQuery="aws" />);

    const searchInput = screen.getByPlaceholderText("Search");
    expect(searchInput).toHaveValue("aws");
  });

  it("applies accent background to grid button when grid mode is active", () => {
    render(<ServerFilters {...defaultProps} viewMode="grid" />);

    const gridButton = screen.getByLabelText("Grid view");
    expect(gridButton).toHaveClass("bg-accent");
  });

  it("applies accent background to list button when list mode is active", () => {
    render(<ServerFilters {...defaultProps} viewMode="list" />);

    const listButton = screen.getByLabelText("List view");
    expect(listButton).toHaveClass("bg-accent");
  });
});
