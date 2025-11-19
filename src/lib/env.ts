export function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error(
      "API_BASE_URL environment variable is required for API requests",
    );
  }

  return apiBaseUrl;
}
