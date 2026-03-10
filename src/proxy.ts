import { type NextRequest, NextResponse } from "next/server";

/**
 * Injects the current request pathname+search as an `x-url` header so that
 * Server Components can pass the original URL to the token-refresh Route Handler
 * for redirect-back after a preemptive token refresh.
 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-url",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run on all routes except Next.js internals and static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
