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

// PUT: Update Team
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
      description: body.description || ""
    };
    
    if (body.leader_id) {
      updateRequest.leader_id = parseInt(body.leader_id);
    }

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.TeamService.UpdateTeam(updateRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("UpdateTeam gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to update team" },
      { status: error?.code === grpc.status.NOT_FOUND ? 404 : 500 }
    );
  }
}

// DELETE: Delete Team
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
    const response = await GrpcClient.TeamService.DeleteTeam(deleteRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("DeleteTeam gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to delete team" },
      { status: error?.code === grpc.status.NOT_FOUND ? 404 : 500 }
    );
  }
}
