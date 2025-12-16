/**
 * Cryptographic utilities for token encryption and decryption.
 * Separated to avoid circular dependencies with auth modules.
 */

import { createHash } from "node:crypto";
import * as jose from "jose";
import type { OidcTokenData } from "./types";

/**
 * Derives encryption key from secret.
 * Uses SHA-256 to derive exactly 32 bytes (256 bits) from the provided secret,
 * ensuring compatibility with AES-256-GCM regardless of secret length.
 */
function getSecret(secret: string): Uint8Array {
  // Hash the secret to get exactly 32 bytes for AES-256-GCM
  return new Uint8Array(createHash("sha256").update(secret).digest());
}

/**
 * Encrypts token data using JWE (JSON Web Encryption).
 * Uses AES-256-GCM with direct key agreement (alg: 'dir').
 * Exported for testing purposes.
 */
export async function encrypt(
  data: OidcTokenData,
  secret: string,
): Promise<string> {
  const key = getSecret(secret);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  return await new jose.CompactEncrypt(plaintext)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(key);
}

/**
 * Decrypts JWE token and returns parsed token data.
 * Validates data structure after decryption.
 * Exported for testing purposes.
 */
export async function decrypt(
  jwe: string,
  secret: string,
): Promise<OidcTokenData> {
  try {
    const key = getSecret(secret);
    const { plaintext } = await jose.compactDecrypt(jwe, key);
    const data = JSON.parse(new TextDecoder().decode(plaintext));

    if (!isOidcTokenData(data)) {
      throw new Error("Invalid token data structure");
    }

    return data;
  } catch (error) {
    if (error instanceof jose.errors.JWEDecryptionFailed) {
      throw new Error("Token decryption failed - possible tampering");
    }
    if (error instanceof jose.errors.JWEInvalid) {
      throw new Error("Invalid JWE format");
    }
    // Wrap unexpected errors to avoid exposing internal details
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Token decryption error: ${message}`);
  }
}

/**
 * Type guard to validate OidcTokenData structure at runtime.
 * Used after decrypting token data from cookie to ensure data integrity.
 * Note: idToken is not validated here as it's optional and not critical for token validation.
 */
export function isOidcTokenData(data: unknown): data is OidcTokenData {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.accessToken === "string" &&
    typeof obj.accessTokenExpiresAt === "number" &&
    typeof obj.userId === "string" &&
    (obj.refreshToken === undefined || typeof obj.refreshToken === "string") &&
    (obj.refreshTokenExpiresAt === undefined ||
      typeof obj.refreshTokenExpiresAt === "number")
  );
}
