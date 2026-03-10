import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { OIDC_PROVIDER_ID } from "@/lib/auth/constants";

/**
 * Route Handler for preemptive OIDC token refresh.
 *
 * Server Components cannot call `cookies().set()`, so they cannot save
 * the rotated refresh token that Better Auth places in Set-Cookie headers
 * after a token refresh. This Route Handler acts as a proxy:
 *
 * 1. Calls `auth.api.getAccessToken({ asResponse: true })` to trigger the refresh.
 * 2. Copies the resulting Set-Cookie headers directly onto an HTTP redirect response.
 *    (Route Handlers CAN set cookies via the HTTP response, unlike Server Components.)
 * 3. Redirects the browser back to the original page.
 *
 * The browser follows the redirect, the `Set-Cookie` headers update the
 * `account_data` cookie with the rotated refresh token (R2), and the page
 * renders with a fresh, valid token.
 */
export async function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get("redirect") || "/catalog";
  // Validate redirect target — must be a relative path to prevent open redirects.
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/catalog";

  const requestHeaders = await headers();

  try {
    const tokenResponse = await auth.api.getAccessToken({
      headers: requestHeaders,
      body: { providerId: OIDC_PROVIDER_ID },
      asResponse: true,
    });

    if (!tokenResponse.ok) {
      console.warn(
        "[TokenRefresh] getAccessToken failed:",
        tokenResponse.status,
      );
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    const redirectResponse = NextResponse.redirect(
      new URL(safeRedirect, request.url),
    );

    // Copy Set-Cookie headers from Better Auth's internal response directly
    // onto the HTTP redirect response. This is the correct mechanism to propagate
    // the rotated refresh token (R2) to the browser cookie — Route Handlers can
    // write cookies via the HTTP response, unlike Server Components.
    const betterAuthHeaders =
      tokenResponse.headers as typeof tokenResponse.headers & {
        getSetCookie?: () => string[];
      };
    const setCookieHeaders =
      typeof betterAuthHeaders.getSetCookie === "function"
        ? betterAuthHeaders.getSetCookie()
        : (() => {
            const raw = tokenResponse.headers.get("set-cookie");
            return raw ? [raw] : [];
          })();

    for (const cookie of setCookieHeaders) {
      redirectResponse.headers.append("set-cookie", cookie);
    }

    return redirectResponse;
  } catch (err) {
    console.error("[TokenRefresh] Unexpected error:", err);
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}
