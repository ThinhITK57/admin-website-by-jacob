import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: POST /api/auth/refresh
 *
 * Refreshes the access token using a valid refresh token.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // TODO: In production, validate refresh token via gRPC backend
    // For now, just issue a new mock token

    if (!refresh_token.startsWith("mock-refresh-")) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      access_token: `mock-jwt-${Date.now()}`,
      refresh_token: `mock-refresh-${Date.now()}`,
      expires_in: 1800,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
