import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/mocks/test.setup.ts", "./vitest.setup.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],
    env: {
      // Exactly 32 bytes for AES-256
      BETTER_AUTH_SECRET: "12345678901234567890123456789012", // Exactly 32 bytes for AES-256
      OIDC_PROVIDER_ID: "oidc",
      OIDC_ISSUER_URL: "https://test-issuer.com",
      OIDC_CLIENT_ID: "test-client-id",
      OIDC_CLIENT_SECRET: "test-client-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "src/generated/**",
        "src/mocks/**",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/test.setup.ts",
        "vitest.setup.ts",
        "vitest.config.mts",
        "next.config.ts",
        "postcss.config.mjs",
        "openapi-ts.config.ts",
        "scripts/**",
        "dev-auth/**",
        "helm/**",
      ],
    },
  },
});
