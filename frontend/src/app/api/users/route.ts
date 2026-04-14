import { NextRequest, NextResponse } from "next/server";
import { GrpcClient } from "@/lib/grpc";
import * as grpc from '@grpc/grpc-js';

// Helper to extract auth header and create gRPC metadata
function getGrpcMetadata(request: NextRequest): grpc.Metadata {
  const metadata = new grpc.Metadata();
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    // Pass the raw header value (e.g. "Bearer token...") to backend interceptor
    metadata.add("authorization", authHeader);
  }
  return metadata;
}

// GET: List Users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Create a request matching the gRPC ListFilter and Pagination messages
    const listRequest = {
      pagination: {
        page: page,
        page_size: pageSize,
        sort_by: searchParams.get('sortBy') || 'id',
        sort_order: searchParams.get('sortOrder') || 'desc',
      },
      search: searchParams.get('search') || '',
      filters: []
    };

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.UserService.ListUsers(listRequest, metadata);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("ListUsers gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to fetch users" },
      { status: error?.code === grpc.status.UNAUTHENTICATED ? 401 : 500 }
    );
  }
}

// POST: Create User
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create mapping to match CreateUserRequest
    const createRequest = {
      name: body.name,
      email: body.email,
      password: body.password || "defaultPassword123", // default temp pwd
      phone: body.phone,
      avatar: body.avatar,
      team_id: body.team_id,
      role_ids: body.role_ids || [],
    };

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.UserService.CreateUser(createRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("CreateUser gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to create user" },
      { status: error?.code === grpc.status.ALREADY_EXISTS ? 409 : 500 }
    );
  }
}
