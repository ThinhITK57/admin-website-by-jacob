import { NextRequest, NextResponse } from "next/server";
import { GrpcClient } from "@/lib/grpc";
import * as grpc from '@grpc/grpc-js';

/**
 * API Route: POST /api/auth/login
 *
 * Proxies login requests to the gRPC backend.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    try {
      const response: any = await GrpcClient.UserService.Login({ email, password });
      
      // Map the response correctly to our frontend format
      return NextResponse.json({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        expires_in: response.expires_in,
        user: {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone || "",
          avatar: response.user.avatar || "",
          status: response.user.status || "active",
          team_id: response.user.team_id || null,
          team_name: response.user.team_name || "",
          roles: response.user.roles || [],
        },
      });

    } catch (grpcError: any) {
      console.error("Login gRPC Error:", grpcError);
      
      let status = 500;
      let message = "Internal server error";

      if (grpcError.code === grpc.status.UNAUTHENTICATED) {
        status = 401;
        message = "Email hoặc mật khẩu không chính xác";
      } else if (grpcError.code === grpc.status.NOT_FOUND) {
        status = 404;
        message = "Không tìm thấy người dùng";
      }

      return NextResponse.json({ error: message }, { status });
    }

  } catch (error) {
    console.error("Login Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
