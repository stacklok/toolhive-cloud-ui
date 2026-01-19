/**
 * Proxy for OIDC token refresh.
 *
 * Checks if the OIDC access token is expired or about to expire,
 * and refreshes it before the request continues to SSR.
 * This runs BEFORE server components render, so it can set cookies.
 *
 * Note: In Next.js 16+, this file replaces middleware.ts.
 * The proxy runs in Node.js runtime (not Edge).
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  clearTokenCookiesOnResponse,
  decryptTokenData,
  encryptTokenData,
  readTokenFromRequest,
  setTokenCookiesOnResponse,
} from "@/lib/auth/cookie";
import { needsRefresh, refreshTokenWithProvider } from "@/lib/auth/token";

// Proxy-specific constants
const BETTER_AUTH_SESSION_COOKIE = "better-auth.session";

// Routes that don't need token refresh
const PUBLIC_ROUTES = ["/signin", "/api/auth"];
const STATIC_EXTENSIONS = [
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".css",
  ".js",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes and static files
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return NextResponse.next();
  }

  // Skip if no Better Auth session cookie (user not logged in)
  const sessionCookie = request.cookies.get(BETTER_AUTH_SESSION_COOKIE);
  if (!sessionCookie) {
    return NextResponse.next();
  }

  // Read the OIDC token cookie
  const encryptedToken = readTokenFromRequest(request);
  if (!encryptedToken) {
    return NextResponse.next();
  }

  // Decrypt and validate token data
  const tokenData = await decryptTokenData(encryptedToken);
  if (!tokenData) {
    return NextResponse.next();
  }

  // Check if token needs refresh
  if (!needsRefresh(tokenData)) {
    return NextResponse.next();
  }

  console.log("[Proxy] Token needs refresh, refreshing...");

  // Refresh the token
  const newTokenData = await refreshTokenWithProvider(tokenData);

  if (!newTokenData) {
    // Refresh failed - clear the token cookie and let the app handle re-authentication
    const response = NextResponse.next();
    clearTokenCookiesOnResponse(response, request);
    return response;
  }

  // Encrypt and set the new token
  const encrypted = await encryptTokenData(newTokenData);
  const response = NextResponse.next();

  // Clear old chunked cookies first (if any)
  clearTokenCookiesOnResponse(response, request);

  // Set the new token cookie(s)
  setTokenCookiesOnResponse(response, encrypted);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
