import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    env: {
      BETTER_AUTH_SECRET: "12345678901234567890123456789012", // Exactly 32 bytes for AES-256
      OIDC_PROVIDER_ID: "test-oidc",
      OIDC_ISSUER: "https://test-issuer.com",
      BETTER_AUTH_URL: "http://localhost:3000",
    },
  },
});
