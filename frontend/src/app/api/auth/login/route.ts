import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: POST /api/auth/login
 *
 * Proxies login requests to the gRPC backend.
 * For MVP demo, this returns mock data. In production,
 * this would call the gRPC UserService.Login.
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

    // TODO: In production, call gRPC backend:
    // const channel = createChannel('localhost:50051');
    // const client = createClient(UserServiceDefinition, channel);
    // const response = await client.login({ email, password });

    // Mock authentication for demo
    const mockUsers: Record<
      string,
      {
        id: number;
        name: string;
        roles: { id: number; name: string }[];
        team_id?: number;
        team_name?: string;
      }
    > = {
      "admin@company.vn": {
        id: 1,
        name: "Super Admin",
        roles: [{ id: 1, name: "super_admin" }],
      },
      "leader.sale@company.vn": {
        id: 2,
        name: "Nguyễn Văn Leader",
        roles: [{ id: 3, name: "leader" }],
        team_id: 1,
        team_name: "Team Sale Telesale 1",
      },
      "sale1@company.vn": {
        id: 3,
        name: "Trần Thị Sale1",
        roles: [{ id: 4, name: "nhan_vien" }],
        team_id: 1,
        team_name: "Team Sale Telesale 1",
      },
      "ads@company.vn": {
        id: 4,
        name: "Lê Văn Ads",
        roles: [{ id: 4, name: "nhan_vien" }],
        team_id: 2,
        team_name: "Team Marketing Ads",
      },
    };

    const mockUser = mockUsers[email];
    if (!mockUser || password !== "password") {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không chính xác" },
        { status: 401 }
      );
    }

    const accessToken = `mock-jwt-${Date.now()}`;
    const refreshToken = `mock-refresh-${Date.now()}`;

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 1800,
      user: {
        id: mockUser.id,
        name: mockUser.name,
        email,
        phone: "",
        avatar: "",
        status: "active",
        team_id: mockUser.team_id || null,
        team_name: mockUser.team_name || "",
        roles: mockUser.roles,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
