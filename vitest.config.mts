import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/mocks/test.setup.ts", "./vitest.setup.ts"],
    env: {
      // Exactly 32 bytes for AES-256
      BETTER_AUTH_SECRET: "12345678901234567890123456789012", // Exactly 32 bytes for AES-256
      NEXT_PUBLIC_OIDC_PROVIDER_ID: "oidc",
      OIDC_ISSUER_URL: "https://test-issuer.com",
      OIDC_CLIENT_ID: "test-client-id",
      OIDC_CLIENT_SECRET: "test-client-secret",
      BETTER_AUTH_URL: "http://localhost:3000",
    },
  },
});
