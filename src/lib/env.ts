export function getApiBaseUrl(): string {
  // Return empty string if not set to allow Next.js build to complete.
  // API requests will fail at runtime with fetch errors if not properly configured.
  return process.env.API_BASE_URL || "";
}
