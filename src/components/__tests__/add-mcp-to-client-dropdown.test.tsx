import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MCP_CLIENT_LIST } from "@/lib/mcp/client-configs";
import { AddMcpToClientDropdown } from "../add-mcp-to-client-dropdown";

// Mock the hook
const mockOpenInClient = vi.fn();
const mockCopyCommand = vi.fn();

vi.mock("@/hooks/use-add-mcp-to-client", () => ({
  useAddMcpToClient: () => ({
    openInClient: mockOpenInClient,
    copyCommand: mockCopyCommand,
  }),
}));

describe("AddMcpToClientDropdown", () => {
  const defaultProps = {
    serverName: "test-server",
    serverUrl: "https://example.com/mcp",
  };

  it("renders the dropdown trigger button", () => {
    render(<AddMcpToClientDropdown {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: /add to client/i }),
    ).toBeVisible();
  });

  it("shows all client options when opened", async () => {
    const user = userEvent.setup();
    render(<AddMcpToClientDropdown {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /add to client/i }));

    for (const { label } of MCP_CLIENT_LIST) {
      expect(screen.getByRole("menuitem", { name: label })).toBeVisible();
    }
  });

  it("calls openInClient when clicking a deeplink client (Cursor)", async () => {
    const user = userEvent.setup();
    render(<AddMcpToClientDropdown {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /add to client/i }));
    await user.click(screen.getByRole("menuitem", { name: "Cursor" }));

    expect(mockOpenInClient).toHaveBeenCalledWith("cursor");
    expect(mockCopyCommand).not.toHaveBeenCalled();
  });

  it("calls openInClient when clicking VS Code", async () => {
    const user = userEvent.setup();
    render(<AddMcpToClientDropdown {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /add to client/i }));
    await user.click(screen.getByRole("menuitem", { name: "VS Code" }));

    expect(mockOpenInClient).toHaveBeenCalledWith("vscode");
    expect(mockCopyCommand).not.toHaveBeenCalled();
  });

  it("calls copyCommand when clicking Claude Code", async () => {
    const user = userEvent.setup();
    render(<AddMcpToClientDropdown {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /add to client/i }));
    await user.click(screen.getByRole("menuitem", { name: /claude code/i }));

    expect(mockCopyCommand).toHaveBeenCalledWith("claude-code");
    expect(mockOpenInClient).not.toHaveBeenCalled();
  });
});
