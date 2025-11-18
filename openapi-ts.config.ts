import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./swagger.json",
  output: {
    case: undefined,
    path: "./src/generated",
    format: "biome",
    lint: "biome",
  },
  plugins: ["@hey-api/client-next"],
});
