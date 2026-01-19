import { renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { useAddMcpToClient } from "@/hooks/use-add-mcp-to-client";
import {
  buildCursorDeeplink,
  buildVSCodeCommand,
  buildVSCodeMcpJson,
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

  it("copies VS Code --add-mcp command to clipboard", async () => {
    const writeText = mockClipboardWriteText();

    const serverName = "my-server";
    const config: McpTransportConfig = { url: "https://example.com/mcp" };

    const { result } = renderHook(() =>
      useAddMcpToClient({ serverName, config }),
    );

    await result.current.copyCommand(MCP_CLIENTS.vscode);

    expect(writeText).toHaveBeenCalledWith(
      buildVSCodeCommand(serverName, config),
    );
    expect(toast.success).toHaveBeenCalledWith("VS Code command copied!");
  });

  it("copies VS Code JSON config to clipboard (pretty-printed)", async () => {
    const writeText = mockClipboardWriteText();

    const serverName = "my-server";
    const config: McpTransportConfig = { url: "https://example.com/mcp" };

    const { result } = renderHook(() =>
      useAddMcpToClient({ serverName, config }),
    );

    await result.current.copyJsonConfig(MCP_CLIENTS.vscode);

    const expectedJson = JSON.stringify(
      buildVSCodeMcpJson(serverName, config),
      null,
      2,
    );
    expect(writeText).toHaveBeenCalledWith(expectedJson);
    expect(toast.success).toHaveBeenCalledWith("VS Code config copied!");
  });

  it("shows an error when trying to open a client without deeplink (VS Code)", () => {
    vi.spyOn(window, "open").mockImplementation(() => null);

    const serverName = "my-server";
    const config: McpTransportConfig = { url: "https://example.com/mcp" };

    const { result } = renderHook(() =>
      useAddMcpToClient({ serverName, config }),
    );

    result.current.openInClient(MCP_CLIENTS.vscode);

    expect(toast.error).toHaveBeenCalledWith(
      "VS Code doesn't support direct installation. Use the copy command instead.",
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

  it("shows an error when copying JSON config for a client that doesn't expose one (Cursor)", async () => {
    const writeText = mockClipboardWriteText();

    const serverName = "my-server";
    const config: McpTransportConfig = { url: "https://example.com/mcp" };

    const { result } = renderHook(() =>
      useAddMcpToClient({ serverName, config }),
    );

    await result.current.copyJsonConfig(MCP_CLIENTS.cursor);

    expect(writeText).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "No JSON config available for Cursor",
    );
  });
});
