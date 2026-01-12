"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  buildClaudeCodeCommand,
  buildCursorDeeplink,
  buildVSCodeCommand,
  buildVSCodeMcpJson,
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
  deeplink?: string | null;
  command?: string;
  jsonConfig?: object | null;
  metadata: (typeof CLIENT_METADATA)[McpClientType];
}

interface UseAddToClientReturn {
  /** Open deeplink (Cursor only) */
  openInClient: (client: McpClientType) => void;
  /** Copy command to clipboard */
  copyCommand: (client: McpClientType) => Promise<void>;
  /** Copy JSON config to clipboard (VS Code only) */
  copyJsonConfig: (client: McpClientType) => Promise<void>;
}

async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Failed to copy to clipboard");
  }
}

const buildClientConfigs = (
  serverName: string,
  config: McpTransportConfig,
): Record<McpClientType, ClientConfig> => {
  return {
    [MCP_CLIENTS.cursor]: {
      deeplink: buildCursorDeeplink(serverName, config),
      metadata: CLIENT_METADATA[MCP_CLIENTS.cursor],
    },
    [MCP_CLIENTS.vscode]: {
      command: buildVSCodeCommand(serverName, config),
      jsonConfig: buildVSCodeMcpJson(serverName, config),
      metadata: CLIENT_METADATA[MCP_CLIENTS.vscode],
    },
    [MCP_CLIENTS.claudeCode]: {
      command: buildClaudeCodeCommand(serverName, config),
      metadata: CLIENT_METADATA[MCP_CLIENTS.claudeCode],
    },
  };
};

/**
 * Hook for adding MCP servers to different clients.
 * Exposes helper actions to open/copy client-specific MCP install artifacts (Cursor deeplink,
 * VS Code/Claude Code commands, VS Code JSON config). Artifacts are generated on demand.
 */
export function useAddMcpToClient({
  serverName,
  config,
}: UseAddToClientOptions): UseAddToClientReturn {
  const openInClient = useCallback(
    (client: McpClientType) => {
      const clientConfig = buildClientConfigs(serverName, config)[client];

      if (clientConfig.deeplink) {
        window.open(clientConfig.deeplink, "_self");
      } else {
        toast.error(
          `${clientConfig.metadata.name} doesn't support direct installation. Use the copy command instead.`,
        );
      }
    },
    [serverName, config],
  );

  const copyCommand = useCallback(
    async (client: McpClientType) => {
      const clientConfig = buildClientConfigs(serverName, config)[client];
      if (!clientConfig.command) {
        toast.error(`No command available for ${clientConfig.metadata.name}`);
        return;
      }
      await copyToClipboard(
        clientConfig.command,
        `${clientConfig.metadata.name} command copied!`,
      );
    },
    [serverName, config],
  );

  const copyJsonConfig = useCallback(
    async (client: McpClientType) => {
      const clientConfig = buildClientConfigs(serverName, config)[client];
      if (!clientConfig.jsonConfig) {
        toast.error(
          `No JSON config available for ${clientConfig.metadata.name}`,
        );
        return;
      }
      const clientJsonConfig = JSON.stringify(clientConfig.jsonConfig, null, 2);
      await copyToClipboard(
        clientJsonConfig,
        `${clientConfig.metadata.name} config copied!`,
      );
    },
    [serverName, config],
  );

  return {
    openInClient,
    copyCommand,
    copyJsonConfig,
  };
}
