import { NextRequest, NextResponse } from "next/server";
import { GrpcClient } from "@/lib/grpc";
import * as grpc from '@grpc/grpc-js';

function getGrpcMetadata(request: NextRequest): grpc.Metadata {
  const metadata = new grpc.Metadata();
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    metadata.add("authorization", authHeader);
  }
  return metadata;
}

// GET: List Permissions
export async function GET(request: NextRequest) {
  try {
    const listRequest = {
      pagination: {
        page: 1,
        page_size: 1000,
      },
    };

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.RoleService.ListPermissions(listRequest, metadata);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("ListPermissions gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to fetch permissions" },
      { status: error?.code === grpc.status.UNAUTHENTICATED ? 401 : 500 }
    );
  }
}
