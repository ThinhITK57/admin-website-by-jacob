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

// PUT: Update Campaign
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
      channel: body.channel || "other",
      status: body.status || "draft",
    };

    if (body.budget) updateRequest.budget = parseFloat(body.budget);
    if (body.start_date) updateRequest.start_date = body.start_date;
    if (body.end_date) updateRequest.end_date = body.end_date;

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.CampaignService.UpdateCampaign(updateRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("UpdateCampaign gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to update campaign" },
      { status: error?.code === grpc.status.NOT_FOUND ? 404 : 500 }
    );
  }
}

// DELETE: Delete Campaign
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
    const response = await GrpcClient.CampaignService.DeleteCampaign(deleteRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("DeleteCampaign gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to delete campaign" },
      { status: error?.code === grpc.status.NOT_FOUND ? 404 : 500 }
    );
  }
}
