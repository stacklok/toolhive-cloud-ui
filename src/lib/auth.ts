import { createHash } from "node:crypto";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import * as jose from "jose";
import { cookies } from "next/headers";

// Environment configuration
const OIDC_PROVIDER_ID = process.env.OIDC_PROVIDER_ID || "oidc";
const OIDC_ISSUER = process.env.OIDC_ISSUER || "";
const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Gets the encryption secret for JWE.
 * Uses SHA-256 to derive exactly 32 bytes (256 bits) from BETTER_AUTH_SECRET,
 * ensuring compatibility with AES-256-GCM regardless of secret length.
 * Lazy initialization avoids build-time errors when env vars are not set.
 */
function getSecret(): Uint8Array {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET environment variable is required for encryption",
    );
  }
  // Hash the secret to get exactly 32 bytes for AES-256-GCM
  return new Uint8Array(createHash("sha256").update(secret).digest());
}

// Token expiration constants
const TOKEN_ONE_HOUR_MS = 60 * 60 * 1000; // milliseconds
const TOKEN_SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60; // seconds

// Cookie configuration
const COOKIE_NAME = "oidc_token" as const;

const trustedOrigins = process.env.TRUSTED_ORIGINS
  ? process.env.TRUSTED_ORIGINS.split(",").map((s) => s.trim())
  : [BASE_URL, "http://localhost:3002", "http://localhost:3003"];

if (!trustedOrigins.includes(BASE_URL)) {
  trustedOrigins.push(BASE_URL);
}

/**
 * Represents the data stored in the encrypted OIDC token cookie.
 */
export interface OidcTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userId: string;
}

/**
 * Type guard to validate OidcTokenData structure at runtime.
 */
function isOidcTokenData(data: unknown): data is OidcTokenData {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.accessToken === "string" &&
    typeof obj.expiresAt === "number" &&
    typeof obj.userId === "string" &&
    (obj.refreshToken === undefined || typeof obj.refreshToken === "string")
  );
}

/**
 * Encrypts token data using JWE (JSON Web Encryption).
 * Uses AES-256-GCM with direct key agreement (alg: 'dir').
 * Exported for testing purposes.
 */
export async function encrypt(data: OidcTokenData): Promise<string> {
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  return await new jose.CompactEncrypt(plaintext)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(getSecret());
}

/**
 * Decrypts JWE token and returns parsed token data.
 * Validates data structure after decryption.
 * Exported for testing purposes.
 */
export async function decrypt(jwe: string): Promise<OidcTokenData> {
  try {
    const { plaintext } = await jose.compactDecrypt(jwe, getSecret());
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
    throw error;
  }
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "build-time-better-auth-secret",
  baseURL: BASE_URL,
  trustedOrigins,
  session: {
    cookieCache: {
      enabled: true,
    },
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: OIDC_PROVIDER_ID,
          discoveryUrl: `${OIDC_ISSUER}/.well-known/openid-configuration`,
          redirectURI: `${BASE_URL}/api/auth/oauth2/callback/${OIDC_PROVIDER_ID}`,
          clientId: process.env.OIDC_CLIENT_ID || "",
          clientSecret: process.env.OIDC_CLIENT_SECRET || "",
          scopes: ["openid", "email", "profile"],
          pkce: true,
        },
      ],
    }),
  ],
  // Use databaseHooks to save tokens in HTTP-only cookie after account creation
  databaseHooks: {
    account: {
      create: {
        after: async (account: {
          accessToken?: string;
          refreshToken?: string;
          accessTokenExpiresAt?: Date | string;
          userId: string;
        }) => {
          if (account.accessToken && account.userId) {
            const expiresAt = account.accessTokenExpiresAt
              ? new Date(account.accessTokenExpiresAt).getTime()
              : Date.now() + TOKEN_ONE_HOUR_MS;

            const tokenData: OidcTokenData = {
              accessToken: account.accessToken,
              refreshToken: account.refreshToken || undefined,
              expiresAt,
              userId: account.userId,
            };

            const encrypted = await encrypt(tokenData);
            const cookieStore = await cookies();

            cookieStore.set(COOKIE_NAME, encrypted, {
              httpOnly: true,
              secure: IS_PRODUCTION,
              sameSite: "lax",
              maxAge: TOKEN_SEVEN_DAYS_SECONDS,
              path: "/",
            });
          }
        },
      },
    },
  },
} as BetterAuthOptions);

/**
 * Retrieves the OIDC provider access token from HTTP-only cookie.
 * Returns null if token not found, expired, or belongs to different user.
 */
export async function getOidcProviderAccessToken(
  userId: string,
): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const encryptedCookie = cookieStore.get(COOKIE_NAME);

    if (!encryptedCookie?.value) {
      return null;
    }

    let tokenData: OidcTokenData;
    try {
      tokenData = await decrypt(encryptedCookie.value);
    } catch (error) {
      // Decryption failure indicates tampering, corruption, or wrong secret
      console.error(
        "[Auth] Token decryption failed - possible tampering or invalid format:",
        error,
      );
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    // Verify the token belongs to the current user
    if (tokenData.userId !== userId) {
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    // Check if token is expired
    const now = Date.now();
    if (tokenData.expiresAt <= now) {
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    return tokenData.accessToken;
  } catch (error) {
    // Unexpected error (e.g., cookie operations failure)
    console.error("[Auth] Unexpected error reading OIDC token:", error);
    return null;
  }
}

/**
 * Clears the OIDC token cookie (useful for logout).
 */
export async function clearOidcProviderToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
