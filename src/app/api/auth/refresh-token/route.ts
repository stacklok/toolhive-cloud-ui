import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/auth/auth";
import { BETTER_AUTH_SECRET, COOKIE_NAME } from "@/lib/auth/constants";
import type { OidcTokenData } from "@/lib/auth/types";
import { decrypt } from "@/lib/auth/utils";

/**
 * API Route Handler to refresh OIDC access token.
 *
 * This Route Handler can modify cookies (unlike Server Actions during render).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const encryptedCookie = cookieStore.get(COOKIE_NAME);

    if (!encryptedCookie?.value) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    let tokenData: OidcTokenData;
    try {
      tokenData = await decrypt(encryptedCookie.value, BETTER_AUTH_SECRET);
    } catch (error) {
      console.error("[Refresh API] Token decryption failed:", error);
      cookieStore.delete(COOKIE_NAME);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (tokenData.userId !== userId) {
      console.error("[Refresh API] Token userId mismatch");
      cookieStore.delete(COOKIE_NAME);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!tokenData.refreshToken) {
      console.error("[Refresh API] No refresh token available");
      cookieStore.delete(COOKIE_NAME);
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    // Call refreshAccessToken which will save the new token in the cookie
    const refreshedData = await refreshAccessToken(
      tokenData.refreshToken,
      userId,
      tokenData.refreshTokenExpiresAt,
    );

    if (!refreshedData) {
      console.error("[Refresh API] Token refresh failed");
      cookieStore.delete(COOKIE_NAME);
      return NextResponse.json({ error: "Refresh failed" }, { status: 401 });
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
