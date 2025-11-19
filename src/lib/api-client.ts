/**
 * API Client Configuration
 *
 * Configures the hey-api generated client with the correct base URL.
 * This must be imported before any API calls are made.
 */

import { client } from "@/generated/client.gen";

// Configure client with baseUrl for both SSR and client-side
// In development: points to standalone MSW mock server (http://localhost:9090)
// In production: points to real backend API
client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9090",
});

export { client };
