import { renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { useAddMcpToClient } from "@/hooks/use-add-mcp-to-client";
import {
  buildClaudeCodeCommand,
  buildCursorDeeplink,
  buildVSCodeDeeplink,
  MCP_CLIENTS,
  type McpTransportConfig,
} from "@/lib/mcp/client-configs";

function mockClipboardWriteText() {
  const writeText = vi
    .fn<(text: string) => Promise<void>>()
    .mockResolvedValue(undefined);

  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });

  return writeText;
}

describe("useAddMcpToClient", () => {
  it("opens Cursor deeplink via window.open", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    const serverName = "my-server";
    const config: McpTransportConfig = { url: "https://example.com/mcp" };

    const { result } = renderHook(() =>
      useAddMcpToClient({ serverName, config }),
    );

    result.current.openInClient(MCP_CLIENTS.cursor);

    expect(openSpy).toHaveBeenCalledWith(
      buildCursorDeeplink(serverName, config),
      "_self",
    );
  });

  it("opens VS Code deeplink via window.open", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    const serverName = "my-server";
    const config: McpTransportConfig = { url: "https://example.com/mcp" };

    const { result } = renderHook(() =>
      useAddMcpToClient({ serverName, config }),
    );

    result.current.openInClient(MCP_CLIENTS.vscode);

    expect(openSpy).toHaveBeenCalledWith(
      buildVSCodeDeeplink(serverName, config),
      "_self",
    );
  });

  it("copies Claude Code command to clipboard", async () => {
    const writeText = mockClipboardWriteText();

    const serverName = "my-server";
    const config: McpTransportConfig = { url: "https://example.com/mcp" };

    const { result } = renderHook(() =>
      useAddMcpToClient({ serverName, config }),
    );

    await result.current.copyCommand(MCP_CLIENTS.claudeCode);

    expect(writeText).toHaveBeenCalledWith(
      buildClaudeCodeCommand(serverName, config),
    );
    expect(toast.success).toHaveBeenCalledWith("Claude Code command copied!");
  });

  it("shows an error when trying to open a client without deeplink (Claude Code)", () => {
    vi.spyOn(window, "open").mockImplementation(() => null);

    const serverName = "my-server";
    const config: McpTransportConfig = { url: "https://example.com/mcp" };

    const { result } = renderHook(() =>
      useAddMcpToClient({ serverName, config }),
    );

    result.current.openInClient(MCP_CLIENTS.claudeCode);

    expect(toast.error).toHaveBeenCalledWith(
      "Claude Code doesn't support direct installation. Use the copy command instead.",
    );
  });

  it("shows an error when copying command for a client that doesn't expose one (Cursor)", async () => {
    const writeText = mockClipboardWriteText();

    const serverName = "my-server";
    const config: McpTransportConfig = { url: "https://example.com/mcp" };

    const { result } = renderHook(() =>
      useAddMcpToClient({ serverName, config }),
    );

    await result.current.copyCommand(MCP_CLIENTS.cursor);

    expect(writeText).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("No command available for Cursor");
  });
});
