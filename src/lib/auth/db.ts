/**
 * Database Utilities for Better Auth
 *
 * PostgreSQL connection pool and account query helpers.
 * Used by auth.ts and token.ts for database operations.
 */

import { Pool } from "pg";
import { DATABASE_URL, OIDC_PROVIDER_ID } from "./constants";

// ============================================================================
// Connection Pool
// ============================================================================

/**
 * PostgreSQL connection pool for session storage.
 * Only created when DATABASE_URL is configured.
 */
export const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL })
  : null;

/**
 * Whether we're using database mode (true) or stateless cookie mode (false).
 */
export const isDatabaseMode = !!pool;

/**
 * Closes the database connection pool.
 * Call this during graceful shutdown to release database connections.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}

// ============================================================================
// Types
// ============================================================================

export interface AccountRow {
  id: string;
  userId: string;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Retrieves the access token for a user from the database.
 * Returns null if not found or expired.
 */
export async function getTokenFromDatabase(
  userId: string,
): Promise<string | null> {
  if (!pool) return null;

  try {
    const result = await pool.query<AccountRow>(
      `SELECT "accessToken", "accessTokenExpiresAt" 
       FROM account 
       WHERE "userId" = $1 AND "providerId" = $2`,
      [userId, OIDC_PROVIDER_ID],
    );

    if (result.rows.length === 0) {
      console.log("[DB] No account found for user:", userId);
      return null;
    }

    const account = result.rows[0];

    if (!account.accessToken) {
      console.log("[DB] No access token in account");
      return null;
    }

    if (account.accessTokenExpiresAt) {
      const expiresAt = new Date(account.accessTokenExpiresAt).getTime();
      if (expiresAt <= Date.now()) {
        console.log("[DB] Access token expired");
        return null;
      }
    }

    return account.accessToken;
  } catch (error) {
    console.error("[DB] Error reading token from database:", error);
    return null;
  }
}

/**
 * Retrieves the ID token for a user from the database.
 * Used for OIDC logout (RP-Initiated Logout).
 */
export async function getIdTokenFromDatabase(
  userId: string,
): Promise<string | null> {
  if (!pool) return null;

  try {
    const result = await pool.query<AccountRow>(
      `SELECT "idToken" FROM account WHERE "userId" = $1 AND "providerId" = $2`,
      [userId, OIDC_PROVIDER_ID],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].idToken;
  } catch (error) {
    console.error("[DB] Error reading ID token from database:", error);
    return null;
  }
}

/**
 * Retrieves account data for token refresh.
 * Returns the account row with refresh token info.
 */
export async function getAccountForRefresh(
  userId: string,
): Promise<AccountRow | null> {
  if (!pool) return null;

  try {
    const result = await pool.query<AccountRow>(
      `SELECT id, "refreshToken", "refreshTokenExpiresAt", "idToken" 
       FROM account 
       WHERE "userId" = $1 AND "providerId" = $2`,
      [userId, OIDC_PROVIDER_ID],
    );

    if (result.rows.length === 0) {
      console.error("[DB] No account found for refresh");
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("[DB] Error getting account for refresh:", error);
    return null;
  }
}

/**
 * Updates account tokens after a successful refresh.
 */
export async function updateAccountTokens(
  accountId: string,
  accessToken: string,
  refreshToken: string,
  idToken: string | null,
  accessTokenExpiresAt: Date,
  refreshTokenExpiresAt: Date | null,
): Promise<boolean> {
  if (!pool) return false;

  try {
    await pool.query(
      `UPDATE account 
       SET "accessToken" = $1, "refreshToken" = $2, "idToken" = $3,
           "accessTokenExpiresAt" = $4, "refreshTokenExpiresAt" = $5, "updatedAt" = NOW()
       WHERE id = $6`,
      [
        accessToken,
        refreshToken,
        idToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        accountId,
      ],
    );

    return true;
  } catch (error) {
    console.error("[DB] Error updating account tokens:", error);
    return false;
  }
}
