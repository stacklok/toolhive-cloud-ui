import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import crypto from "crypto";
import { cookies } from "next/headers";

// Environment configuration
const OIDC_PROVIDER_ID = process.env.OIDC_PROVIDER_ID || "oidc";
const OIDC_ISSUER = process.env.OIDC_ISSUER || "";
const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const ENCRYPTION_KEY =
  process.env.BETTER_AUTH_SECRET || "build-time-placeholder";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Encryption constants
const ENCRYPTION_SALT = "oidc_token_salt";
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

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
 * Encrypts data using AES-256-GCM (AEAD).
 * Provides both confidentiality and integrity/authentication.
 * Returns encrypted data in format: iv:authTag:encrypted (all hex-encoded).
 */
function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_SALT, KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

/**
 * Decrypts data encrypted with AES-256-GCM.
 * Verifies authenticity before decryption.
 * Expects data in format: iv:authTag:encrypted (all hex-encoded).
 */
function decrypt(payload: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_SALT, KEY_LENGTH);
  const [ivHex, tagHex, encryptedHex] = payload.split(":");

  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || "build-time-placeholder",
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
        after: async (account) => {
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

            const encrypted = encrypt(JSON.stringify(tokenData));
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

    const decrypted = decrypt(encryptedCookie.value);
    const parsedData: unknown = JSON.parse(decrypted);

    // Runtime validation using type guard
    if (!isOidcTokenData(parsedData)) {
      console.error("[Auth] Invalid token data structure");
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    // Verify the token belongs to the current user
    if (parsedData.userId !== userId) {
      return null;
    }

    // Check if token is expired
    const now = Date.now();
    if (parsedData.expiresAt < now) {
      cookieStore.delete(COOKIE_NAME);
      return null;
    }

    return parsedData.accessToken;
  } catch (error) {
    console.error("[Auth] Error reading OIDC token from cookie:", error);
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
