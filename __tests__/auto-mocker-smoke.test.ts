import fs from "fs";
import path from "path";
import { expect, test } from "vitest";

const FIXTURE_FILE = path.join(
  process.cwd(),
  "src/mocks/fixtures/registry_info/get.ts",
);

test("auto-mocker generates fixture and serves JSON", async () => {
  // Call an endpoint present in swagger.json
  const res = await fetch("http://localhost/api/v0/registry/info");
  expect(res.ok).toBe(true);
  const data = await res.json();
  expect(typeof data).toBe("object");

  // Fixture file should exist after first call
  expect(fs.existsSync(FIXTURE_FILE)).toBe(true);
});
