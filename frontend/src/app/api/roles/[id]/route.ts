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

// PUT: Update Role
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);
    const body = await request.json();
    
    const updateRequest: any = {
      id: id,
      name: body.name,
      description: body.description || "",
      permission_ids: body.permission_ids || []
    };

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.RoleService.UpdateRole(updateRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("UpdateRole gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to update role" },
      { status: error?.code === grpc.status.NOT_FOUND ? 404 : 500 }
    );
  }
}

// DELETE: Delete Role
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
    const response = await GrpcClient.RoleService.DeleteRole(deleteRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("DeleteRole gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to delete role" },
      { status: error?.code === grpc.status.NOT_FOUND ? 404 : 500 }
    );
  }
}
