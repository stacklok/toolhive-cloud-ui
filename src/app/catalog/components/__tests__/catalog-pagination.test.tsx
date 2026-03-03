import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CatalogPagination } from "../catalog-pagination";

const defaultProps = {
  isFirstPage: true,
  nextCursor: undefined,
  limit: 24,
  onPrev: vi.fn(),
  onNext: vi.fn(),
  onLimitChange: vi.fn(),
};

describe("CatalogPagination", () => {
  describe("Previous button", () => {
    it("is disabled on the first page", () => {
      render(<CatalogPagination {...defaultProps} isFirstPage={true} />);
      expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
    });

    it("is enabled when not on the first page", () => {
      render(<CatalogPagination {...defaultProps} isFirstPage={false} />);
      expect(
        screen.getByRole("button", { name: /previous/i }),
      ).not.toBeDisabled();
    });

    it("calls onPrev when clicked", async () => {
      const onPrev = vi.fn();
      const user = userEvent.setup();
      render(
        <CatalogPagination
          {...defaultProps}
          isFirstPage={false}
          onPrev={onPrev}
        />,
      );

      await user.click(screen.getByRole("button", { name: /previous/i }));
      expect(onPrev).toHaveBeenCalledTimes(1);
    });
  });

  describe("Next button", () => {
    it("is disabled when there is no nextCursor", () => {
      render(<CatalogPagination {...defaultProps} nextCursor={undefined} />);
      expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    });

    it("is enabled when nextCursor is provided", () => {
      render(<CatalogPagination {...defaultProps} nextCursor="cursor-abc" />);
      expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
    });

    it("calls onNext with the cursor when clicked", async () => {
      const onNext = vi.fn();
      const user = userEvent.setup();
      render(
        <CatalogPagination
          {...defaultProps}
          nextCursor="cursor-abc"
          onNext={onNext}
        />,
      );

      await user.click(screen.getByRole("button", { name: /next/i }));
      expect(onNext).toHaveBeenCalledWith("cursor-abc");
    });
  });

  describe("Items per page", () => {
    it("renders the label", () => {
      render(<CatalogPagination {...defaultProps} />);
      expect(screen.getByText("Items per page")).toBeVisible();
    });

    it("displays the current limit", () => {
      render(<CatalogPagination {...defaultProps} limit={24} />);
      expect(screen.getByRole("combobox")).toHaveTextContent("24");
    });
  });
});
