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

// GET: List Teams
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
    const response = await GrpcClient.TeamService.ListTeams(listRequest, metadata);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("ListTeams gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to fetch teams" },
      { status: error?.code === grpc.status.UNAUTHENTICATED ? 401 : 500 }
    );
  }
}

// POST: Create Team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const createRequest: any = {
      name: body.name,
      description: body.description || ""
    };
    
    if (body.leader_id) {
      createRequest.leader_id = parseInt(body.leader_id);
    }

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.TeamService.CreateTeam(createRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("CreateTeam gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to create team" },
      { status: error?.code === grpc.status.ALREADY_EXISTS ? 409 : 500 }
    );
  }
}
