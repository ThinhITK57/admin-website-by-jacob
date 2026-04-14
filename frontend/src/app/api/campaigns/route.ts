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

// GET: List Campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const listRequest = {
      pagination: {
        page: page,
        page_size: pageSize,
      },
      search: searchParams.get('search') || '',
      filters: []
    };

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.CampaignService.ListCampaigns(listRequest, metadata);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("ListCampaigns gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to fetch campaigns" },
      { status: error?.code === grpc.status.UNAUTHENTICATED ? 401 : 500 }
    );
  }
}

// POST: Create Campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const createRequest: any = {
      name: body.name,
      channel: body.channel || "other",
      status: body.status || "draft",
    };

    if (body.budget) createRequest.budget = parseFloat(body.budget);
    if (body.start_date) createRequest.start_date = body.start_date;
    if (body.end_date) createRequest.end_date = body.end_date;

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.CampaignService.CreateCampaign(createRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("CreateCampaign gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to create campaign" },
      { status: error?.code === grpc.status.ALREADY_EXISTS ? 409 : 500 }
    );
  }
}
