#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import * as path from "node:path";

/**
 * ToolHive Registry Server version.
 * This is managed by Renovate and updated automatically when new versions are released.
 * renovate: datasource=github-releases depName=stacklok/toolhive-registry-server versioning=semver
 */
const REGISTRY_SERVER_VERSION = "v0.5.3";

(async () => {
  const url = `https://raw.githubusercontent.com/stacklok/toolhive-registry-server/refs/tags/${REGISTRY_SERVER_VERSION}/docs/thv-registry-api/swagger.json`;
  const dest = path.resolve("./swagger.json");

  console.log(`Fetching OpenAPI spec from: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch OpenAPI spec: ${res.status} ${res.statusText}`,
    );
  }
  const data = await res.text();
  await writeFile(dest, data);
  console.log(`Saved OpenAPI spec to: ${dest}`);

  console.log("Formatting with Biome...");
  execSync(`pnpm exec biome format --write "${dest}"`, { stdio: "inherit" });
  console.log("Formatted with Biome.");
})();
