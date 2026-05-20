import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { BASE_URL, OIDC_PROVIDER_ID } from "@/lib/auth/constants";

const BASE_ORIGIN = new URL(BASE_URL).origin;

/**
 * Route Handler for preemptive OIDC token refresh.
 *
 * Server Components cannot call `cookies().set()`, so they cannot save
 * the rotated refresh token that Better Auth places in Set-Cookie headers
 * after a token refresh. This Route Handler acts as a proxy:
 *
 * 1. Calls `auth.api.refreshToken({ asResponse: true })` to FORCE a refresh.
 *    Unlike `getAccessToken`, this bypasses Better Auth's internal 5s threshold,
 *    which is what previously caused a redirect loop when the caller's near-expiry
 *    margin (e.g. 10s) was wider than Better Auth's refresh window: the route
 *    would be re-entered but no refresh (and no Set-Cookie) would occur.
 * 2. Copies the resulting Set-Cookie headers onto the HTTP redirect response so
 *    the browser stores the rotated refresh token. (Route Handlers CAN set cookies
 *    via the HTTP response, unlike Server Components.)
 * 3. Redirects the browser back to the original page.
 *
 * If the refresh fails (e.g. the refresh token has been revoked at the provider),
 * the handler signs the user out via `auth.api.signOut` — which clears both
 * `session_token` and `account_data` cookies — and redirects to /signin. Without
 * this cleanup, the stale `account_data` cookie keeps `isTokenNearExpiry` returning
 * true on every subsequent request, trapping the user in a refresh loop.
 *
 * Both GET and POST are exported: Next.js `redirect()` outside a Server Action uses
 * 307 (method-preserving), so a redirect triggered from a Server Component render
 * that follows a Server Action POST reaches this route as a POST. For the same
 * reason, the outbound redirects below use 303 See Other (forces the browser to
 * follow with GET) — a default 307 would re-POST `/catalog` or `/signin` and 405.
 */
async function handler(request: NextRequest) {
  // Validate redirect target to prevent open redirects.
  // Parse with new URL() and enforce same-origin; extract only pathname+search+hash.
  const redirectParam = request.nextUrl.searchParams.get("redirect");
  let safeRedirect = "/catalog";
  if (redirectParam && !redirectParam.startsWith("//")) {
    try {
      const resolved = new URL(redirectParam, BASE_URL);
      if (resolved.origin === BASE_ORIGIN) {
        safeRedirect = resolved.pathname + resolved.search + resolved.hash;
      }
    } catch {
      // Invalid URL — keep default safeRedirect
    }
  }

  const requestHeaders = await headers();

  try {
    const tokenResponse = await auth.api.refreshToken({
      headers: requestHeaders,
      body: { providerId: OIDC_PROVIDER_ID },
      asResponse: true,
    });

    if (!tokenResponse.ok) {
      console.warn("[TokenRefresh] refreshToken failed:", tokenResponse.status);
      return await signOutAndRedirect(requestHeaders);
    }

    const redirectResponse = NextResponse.redirect(
      new URL(safeRedirect, BASE_URL),
      { status: 303 },
    );

    // Copy Set-Cookie headers from Better Auth's internal response directly
    // onto the HTTP redirect response. This is the correct mechanism to propagate
    // the rotated refresh token (R2) to the browser cookie — Route Handlers can
    // write cookies via the HTTP response, unlike Server Components.
    for (const cookie of extractSetCookies(tokenResponse)) {
      redirectResponse.headers.append("set-cookie", cookie);
    }

    return redirectResponse;
  } catch (err) {
    console.error("[TokenRefresh] Unexpected error:", err);
    return await signOutAndRedirect(requestHeaders);
  }
}

/**
 * Signs the user out (clearing session + account_data cookies via Better Auth)
 * and redirects to /signin. Used when the refresh attempt fails irrecoverably.
 */
async function signOutAndRedirect(
  requestHeaders: Headers,
): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL("/signin", BASE_URL), {
    status: 303,
  });
  try {
    const signOutResponse = await auth.api.signOut({
      headers: requestHeaders,
      asResponse: true,
    });
    for (const cookie of extractSetCookies(signOutResponse)) {
      response.headers.append("set-cookie", cookie);
    }
  } catch (err) {
    // signOut should not fail in practice — it clears cookies even with no
    // active session. Log so we can spot it, but still redirect to /signin.
    console.error("[TokenRefresh] signOut failed during cleanup:", err);
  }
  return response;
}

function extractSetCookies(response: Response): string[] {
  const headers = response.headers as Response["headers"] & {
    getSetCookie?: () => string[];
  };
  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }
  const raw = response.headers.get("set-cookie");
  return raw ? [raw] : [];
}

export const GET = handler;
export const POST = handler;
