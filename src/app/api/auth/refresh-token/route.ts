import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { refreshAccessToken } from "@/lib/auth/token";

/**
 * API Route Handler to refresh OIDC access token.
 * Works in both database mode and stateless cookie mode.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (userId !== session.user.id) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 401 });
    }

    const newAccessToken = await refreshAccessToken(userId);

    if (!newAccessToken) {
      console.error("[Refresh API] Token refresh failed");
      return NextResponse.json({ error: "Refresh failed" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("[Refresh API] Error during token refresh:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
