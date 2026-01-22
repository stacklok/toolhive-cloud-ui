/**
 * MCP client configuration utilities
 * Generates installation configs/commands for different MCP clients
 */

/** Supported MCP client types */
export const MCP_CLIENTS = {
  cursor: "cursor",
  vscode: "vscode",
  claudeCode: "claude-code",
} as const;

export type McpClientType = (typeof MCP_CLIENTS)[keyof typeof MCP_CLIENTS];

/** Transport configuration for remote MCP servers */
export interface McpRemoteConfig {
  url: string;
  headers?: Record<string, string>;
}

/** Transport configuration for stdio MCP servers */
export interface McpStdioConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export type McpTransportConfig = McpRemoteConfig | McpStdioConfig;

/** Check if config is remote (has url) */
export function isRemoteConfig(
  config: McpTransportConfig,
): config is McpRemoteConfig {
  return "url" in config;
}

/** Check if config is stdio (has command) */
export function isStdioConfig(
  config: McpTransportConfig,
): config is McpStdioConfig {
  return "command" in config;
}

/**
 * Client-specific configuration generators
 */

/** Generate Cursor deeplink for MCP installation */
export function buildCursorDeeplink(
  serverName: string,
  config: McpTransportConfig,
): string {
  const configJson = JSON.stringify(config);
  const base64Config = btoa(configJson);
  const encodedName = encodeURIComponent(serverName);
  const encodedConfig = encodeURIComponent(base64Config);

  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodedName}&config=${encodedConfig}`;
}

/** Generate VS Code deeplink for MCP installation */
export function buildVSCodeDeeplink(
  serverName: string,
  config: McpTransportConfig,
): string {
  const mcpConfig = {
    name: serverName,
    ...config,
  };
  const configJson = JSON.stringify(mcpConfig);
  return `vscode:mcp/install?${encodeURIComponent(configJson)}`;
}

/** Generate Claude Code CLI command for MCP installation */
export function buildClaudeCodeCommand(
  serverName: string,
  config: McpTransportConfig,
): string {
  if (isRemoteConfig(config)) {
    let command = `claude mcp add --transport http "${serverName}" ${config.url}`;
    if (config.headers) {
      for (const [key, value] of Object.entries(config.headers)) {
        command += ` --header "${key}: ${value}"`;
      }
    }
    return command;
  }

  // stdio config
  const args = config.args?.join(" ") ?? "";
  return `claude mcp add "${serverName}" -- ${config.command} ${args}`.trim();
}

/** Client metadata for UI display */
export const CLIENT_METADATA: Record<
  McpClientType,
  {
    name: string;
    hasDeeplink: boolean;
    menuLabel: string;
  }
> = {
  [MCP_CLIENTS.cursor]: {
    name: "Cursor",
    hasDeeplink: true,
    menuLabel: "Cursor",
  },
  [MCP_CLIENTS.vscode]: {
    name: "VS Code",
    hasDeeplink: true,
    menuLabel: "VS Code",
  },
  [MCP_CLIENTS.claudeCode]: {
    name: "Claude Code",
    hasDeeplink: false,
    menuLabel: "Claude Code (copy CLI command)",
  },
};

/** List of MCP clients for dropdown menus */
export const MCP_CLIENT_LIST = Object.entries(CLIENT_METADATA).map(
  ([client, metadata]) => ({
    client: client as McpClientType,
    label: metadata.menuLabel,
    action: metadata.hasDeeplink ? ("open" as const) : ("copy" as const),
  }),
);
