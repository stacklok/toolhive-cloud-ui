#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import * as path from "node:path";

(async () => {
  const url =
    "https://raw.githubusercontent.com/stacklok/toolhive-registry-server/refs/heads/main/docs/thv-registry-api/swagger.json";
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
