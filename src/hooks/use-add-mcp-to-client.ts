"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  buildClaudeCodeCommand,
  buildCursorDeeplink,
  buildVSCodeDeeplink,
  CLIENT_METADATA,
  MCP_CLIENTS,
  type McpClientType,
  type McpTransportConfig,
} from "@/lib/mcp/client-configs";

interface UseAddToClientOptions {
  serverName: string;
  config: McpTransportConfig;
}

interface ClientConfig {
  deeplink?: string;
  command?: string;
  metadata: (typeof CLIENT_METADATA)[McpClientType];
}

interface UseAddToClientReturn {
  /** Open deeplink in client (Cursor, VS Code) */
  openInClient: (client: McpClientType) => void;
  /** Copy command to clipboard (Claude Code) */
  copyCommand: (client: McpClientType) => Promise<void>;
}

async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Failed to copy to clipboard");
  }
}

/**
 * Hook for adding MCP servers to different clients.
 * Provides actions to open deeplinks (Cursor, VS Code) or copy CLI commands (Claude Code).
 */
export function useAddMcpToClient({
  serverName,
  config,
}: UseAddToClientOptions): UseAddToClientReturn {
  const clientConfigs = useMemo<Record<McpClientType, ClientConfig>>(
    () => ({
      [MCP_CLIENTS.cursor]: {
        deeplink: buildCursorDeeplink(serverName, config),
        metadata: CLIENT_METADATA[MCP_CLIENTS.cursor],
      },
      [MCP_CLIENTS.vscode]: {
        deeplink: buildVSCodeDeeplink(serverName, config),
        metadata: CLIENT_METADATA[MCP_CLIENTS.vscode],
      },
      [MCP_CLIENTS.claudeCode]: {
        command: buildClaudeCodeCommand(serverName, config),
        metadata: CLIENT_METADATA[MCP_CLIENTS.claudeCode],
      },
    }),
    [serverName, config],
  );

  const openInClient = useCallback(
    (client: McpClientType) => {
      const clientConfig = clientConfigs[client];

      if (clientConfig.deeplink) {
        window.open(clientConfig.deeplink, "_self");
      } else {
        toast.error(
          `${clientConfig.metadata.name} doesn't support direct installation. Use the copy command instead.`,
        );
      }
    },
    [clientConfigs],
  );

  const copyCommand = useCallback(
    async (client: McpClientType) => {
      const clientConfig = clientConfigs[client];
      if (!clientConfig.command) {
        toast.error(`No command available for ${clientConfig.metadata.name}`);
        return;
      }
      await copyToClipboard(
        clientConfig.command,
        `${clientConfig.metadata.name} command copied!`,
      );
    },
    [clientConfigs],
  );

  return {
    openInClient,
    copyCommand,
  };
}
