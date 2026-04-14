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

// GET: List Leads
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
    const response = await GrpcClient.TelesaleService.ListLeads(listRequest, metadata);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("ListLeads gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to fetch leads" },
      { status: error?.code === grpc.status.UNAUTHENTICATED ? 401 : 500 }
    );
  }
}

// POST: Create Lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const createRequest: any = {
      name: body.name,
      phone: body.phone,
      email: body.email || "",
      source: body.source || "",
    };

    if (body.assigned_to) createRequest.assigned_to = parseInt(body.assigned_to);
    if (body.team_id) createRequest.team_id = parseInt(body.team_id);

    const metadata = getGrpcMetadata(request);
    const response = await GrpcClient.TelesaleService.CreateLead(createRequest, metadata);
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("CreateLead gRPC Error:", error);
    return NextResponse.json(
      { error: error?.details || "Failed to create lead" },
      { status: error?.code === grpc.status.ALREADY_EXISTS ? 409 : 500 }
    );
  }
}
