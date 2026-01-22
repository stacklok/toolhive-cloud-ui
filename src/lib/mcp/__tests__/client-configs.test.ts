import { describe, expect, it } from "vitest";
import {
  buildClaudeCodeCommand,
  buildCursorDeeplink,
  buildVSCodeDeeplink,
  type McpRemoteConfig,
  type McpStdioConfig,
} from "../client-configs";

describe("client-configs", () => {
  describe("stdio config", () => {
    const stdioConfig: McpStdioConfig = {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
    };

    it("buildCursorDeeplink encodes stdio config correctly", () => {
      const deeplink = buildCursorDeeplink("fs-server", stdioConfig);

      expect(deeplink).toContain(
        "cursor://anysphere.cursor-deeplink/mcp/install",
      );
      expect(deeplink).toContain("name=fs-server");

      // Decode and verify the config
      const url = new URL(deeplink);
      const encodedConfig = url.searchParams.get("config");

      if (!encodedConfig) {
        throw new Error("Expected config param to be present");
      }

      const decodedConfig = JSON.parse(atob(decodeURIComponent(encodedConfig)));
      expect(decodedConfig).toEqual(stdioConfig);
    });

    it("buildVSCodeDeeplink generates correct deeplink for stdio", () => {
      const deeplink = buildVSCodeDeeplink("fs-server", stdioConfig);

      expect(deeplink).toContain("vscode:mcp/install?");

      // Decode and verify the config
      const encodedConfig = deeplink.replace("vscode:mcp/install?", "");
      const decodedConfig = JSON.parse(decodeURIComponent(encodedConfig));

      expect(decodedConfig).toEqual({
        name: "fs-server",
        ...stdioConfig,
      });
    });

    it("buildClaudeCodeCommand generates correct CLI command for stdio", () => {
      const command = buildClaudeCodeCommand("fs-server", stdioConfig);

      expect(command).toBe(
        'claude mcp add "fs-server" -- npx -y @modelcontextprotocol/server-filesystem /tmp',
      );
    });

    it("buildClaudeCodeCommand handles stdio config without args", () => {
      const simpleConfig: McpStdioConfig = { command: "my-server" };
      const command = buildClaudeCodeCommand("simple", simpleConfig);

      expect(command).toBe('claude mcp add "simple" -- my-server');
    });
  });

  describe("remote config with headers", () => {
    const remoteConfigWithHeaders: McpRemoteConfig = {
      url: "https://api.example.com/mcp",
      headers: {
        Authorization: "Bearer token123",
        "X-Custom-Header": "custom-value",
      },
    };

    it("buildClaudeCodeCommand includes headers as flags", () => {
      const command = buildClaudeCodeCommand(
        "api-server",
        remoteConfigWithHeaders,
      );

      expect(command).toContain(
        'claude mcp add --transport http "api-server" https://api.example.com/mcp',
      );
      expect(command).toContain('--header "Authorization: Bearer token123"');
      expect(command).toContain('--header "X-Custom-Header: custom-value"');
    });

    it("buildVSCodeDeeplink generates correct deeplink for remote config", () => {
      const deeplink = buildVSCodeDeeplink(
        "api-server",
        remoteConfigWithHeaders,
      );

      expect(deeplink).toContain("vscode:mcp/install?");

      // Decode and verify the config
      const encodedConfig = deeplink.replace("vscode:mcp/install?", "");
      const decodedConfig = JSON.parse(decodeURIComponent(encodedConfig));

      expect(decodedConfig).toEqual({
        name: "api-server",
        ...remoteConfigWithHeaders,
      });
    });
  });
});
