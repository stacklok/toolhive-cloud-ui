import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    env: {
      BETTER_AUTH_SECRET: "test-secret-key-for-encryption-32",
      OIDC_PROVIDER_ID: "test-oidc",
      OIDC_ISSUER: "https://test-issuer.com",
      BETTER_AUTH_URL: "http://localhost:3000",
    },
  },
});
