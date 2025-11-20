/**
 * API Client Configuration
 *
 * Configures the hey-api generated client with the correct base URL.
 * This must be imported before any API calls are made.
 *
 * IMPORTANT: The API client should only be used server-side (in server actions,
 * server components, or API routes). All client-side data fetching should go
 * through server actions to avoid exposing the API URL to the browser.
 */

import { client } from "@/generated/client.gen";

// Configure client with baseUrl for server-side operations
// In development: points to standalone MSW mock server
// In production: points to real backend API
client.setConfig({
  baseUrl: process.env.API_BASE_URL || "",
});

export { client };
