import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  async rewrites() {
    if (!isDev) return [];
    return [
      // Proxy registry API to the local MSW mock server in dev
      {
        source: "/registry/:path*",
        destination: "http://localhost:9090/registry/:path*",
      },
    ];
  },
};

export default nextConfig;
