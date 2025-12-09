/**
 * Global scenario names for API mocks.
 *
 * Define scenario names here so they can be reused across different mocks
 * with consistent naming and documentation.
 */

/** Empty state - API returns no data */
export type EmptyServers = "empty-servers";

/** API returns 500 Internal Server Error */
export type ServerError = "server-error";

/**
 * Union of all available mock scenario names.
 *
 * Add new scenario types above and include them in this union.
 */
export type MockScenarioName = EmptyServers | ServerError;
