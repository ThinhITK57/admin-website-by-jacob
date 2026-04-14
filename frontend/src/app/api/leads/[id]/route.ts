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

// PUT: Update Lead
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
      phone: body.phone,
      email: body.email || "",
      source: body.source || "",
      status: body.status || "",
    };

    if (body.assigned_to) updateRequest.assigned_to = parseInt(body.assigned_to);
    if (body.team_id) updateRequest.team_id = parseInt(body.team_id);

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.TelesaleService.UpdateLead(updateRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("UpdateLead gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to update lead" },
      { status: error?.code === grpc.status.NOT_FOUND ? 404 : 500 }
    );
  }
}

// DELETE: Delete Lead
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
    const response = await GrpcClient.TelesaleService.DeleteLead(deleteRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("DeleteLead gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to delete lead" },
      { status: error?.code === grpc.status.NOT_FOUND ? 404 : 500 }
    );
  }
}
