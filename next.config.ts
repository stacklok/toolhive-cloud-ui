import type { NextConfig } from "next";
import { getApiBaseUrl } from "./src/lib/env";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  async rewrites() {
    if (!isDev) return [];

    const apiBaseUrl = getApiBaseUrl();

    return [
      // Proxy registry API in development (to mock server or real backend)
      {
        source: "/registry/:path*",
        destination: `${apiBaseUrl}/registry/:path*`,
      },
    ];
  },
};

export default nextConfig;
