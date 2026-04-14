import { NextRequest, NextResponse } from "next/server";
import { GrpcClient } from "@/lib/grpc";
import * as grpc from '@grpc/grpc-js';

// Helper to extract auth header and create gRPC metadata
function getGrpcMetadata(request: NextRequest): grpc.Metadata {
  const metadata = new grpc.Metadata();
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    metadata.add("authorization", authHeader);
  }
  return metadata;
}

// PUT: Update User
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);
    const body = await request.json();
    
    // Map fields properly if needed
    const updateAttrs: any = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      avatar: body.avatar,
      role_ids: body.role_ids || [],
    };
    
    if (body.team_id !== undefined && body.team_id !== null) {
      updateAttrs.team_id = parseInt(body.team_id);
    }

    const updateRequest = {
      id: id,
      ...updateAttrs
    };

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.UserService.UpdateUser(updateRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("UpdateUser gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to update user" },
      { status: error?.code === grpc.status.NOT_FOUND ? 404 : 500 }
    );
  }
}

// DELETE: Delete (Soft) User
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);
    
    const deleteRequest = {
      id: id
    };

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.UserService.DeleteUser(deleteRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("DeleteUser gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to delete user" },
      { status: error?.code === grpc.status.NOT_FOUND ? 404 : 500 }
    );
  }
}
