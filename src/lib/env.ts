export function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.API_BASE_URL;

  // Allow undefined during Next.js build time when collecting page metadata.
  // The error will be thrown at runtime when actually making API requests.
  if (!apiBaseUrl && process.env.NODE_ENV !== "production") {
    return "";
  }

  if (!apiBaseUrl) {
    throw new Error(
      "API_BASE_URL environment variable is required for API requests",
    );
  }

  return apiBaseUrl;
}
