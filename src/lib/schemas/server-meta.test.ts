import { describe, expect, it } from "vitest";
import type { V0ServerJson } from "@/generated/types.gen";
import { mockedGetRegistryV01Servers } from "@/mocks/fixtures/registry_registryName_v0_1_servers/get";
import { parseStacklokMeta } from "./server-meta";

const servers = mockedGetRegistryV01Servers.defaultValue.servers ?? [];

function getServerByName(serverName: string): V0ServerJson {
  const serverEntry = servers.find(
    (entry) => entry.server?.name === serverName,
  );

  if (!serverEntry?.server) {
    throw new Error(`Test fixture server not found: ${serverName}`);
  }

  return serverEntry.server as V0ServerJson;
}

const osvServer = getServerByName("com.toolhive.k8s.toolhive-system/osv");
const googleWorkspaceServer = getServerByName("google/mcp-google-apps");

describe("parseStacklokMeta", () => {
  it("returns null when stacklok metadata is missing", () => {
    expect(parseStacklokMeta(googleWorkspaceServer)).toBeNull();
  });

  it("returns a successful parse result when stacklok metadata is valid", () => {
    const result = parseStacklokMeta(osvServer);

    expect(result?.success).toBe(true);
  });
});
