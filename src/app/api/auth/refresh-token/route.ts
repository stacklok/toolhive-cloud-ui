import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth, refreshAccessToken } from "@/lib/auth/auth";
import { clearOidcProviderToken, readTokenCookie } from "@/lib/auth/cookie";

/**
 * API Route Handler to refresh OIDC access token.
 *
 * This Route Handler can modify cookies (unlike Server Actions during render).
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Better Auth session exists before attempting token refresh
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      // No active session - skip token refresh (user is logged out)
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Verify userId matches the session
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 401 });
    }

    const tokenData = await readTokenCookie();

    if (!tokenData) {
      console.log("[Refresh API] No OIDC token cookie found, returning 401");
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    if (tokenData.userId !== userId) {
      console.error("[Refresh API] Token userId mismatch");
      await clearOidcProviderToken();
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!tokenData.refreshToken) {
      console.error("[Refresh API] No refresh token available");
      await clearOidcProviderToken();
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    // Call refreshAccessToken which will save the new token in the cookie
    const refreshedData = await refreshAccessToken({
      refreshToken: tokenData.refreshToken,
      refreshTokenExpiresAt: tokenData.refreshTokenExpiresAt,
      userId,
      idToken: tokenData.idToken,
    });

    if (!refreshedData) {
      console.error("[Refresh API] Token refresh failed");
      await clearOidcProviderToken();
      return NextResponse.json(
        { error: "[Refresh API] Refresh failed" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      accessToken: refreshedData.accessToken,
    });
  } catch (error) {
    console.error("[Refresh API] Error during token refresh:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
