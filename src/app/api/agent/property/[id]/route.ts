import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";
import { getPresignedGetUrl } from "@/lib/s3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getLineUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  try {
    await connectDB();
    const doc = await Property.findOne({ _id: id }).lean();
    if (!doc) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    const openForAgent = !!(doc as { openForAgent?: boolean }).openForAgent;
    const agentLineId = (doc as { agentLineId?: string }).agentLineId;
    const isManagingAgent =
      agentLineId != null && agentLineId.trim() !== "" && agentLineId === userId;

    const keys = (doc as { imageKeys?: string[] }).imageKeys ?? [];
    const imageUrls: string[] = [];
    for (const key of keys) {
      const url = await getPresignedGetUrl(key);
      if (url) imageUrls.push(url);
    }

    const contractStartDate = (doc as { contractStartDate?: Date }).contractStartDate;
    const leaseDurationMonths = (doc as { leaseDurationMonths?: number }).leaseDurationMonths;

    const payload: Record<string, unknown> = {
      id: (doc as { _id: mongoose.Types.ObjectId })._id.toString(),
      name: (doc as { name: string }).name,
      type: (doc as { type: string }).type,
      status: (doc as { status?: string }).status,
      price: (doc as { price: number }).price,
      address: (doc as { address: string }).address,
      description: (doc as { description?: string }).description,
      bedrooms: (doc as { bedrooms?: string }).bedrooms,
      bathrooms: (doc as { bathrooms?: string }).bathrooms,
      squareMeters: (doc as { squareMeters?: string }).squareMeters,
      amenities: (doc as { amenities?: string[] }).amenities ?? [],
      imageUrls,
      openForAgent,
      isManagingAgent,
      ...(contractStartDate != null && { contractStartDate: contractStartDate.toISOString() }),
      ...(leaseDurationMonths != null && { leaseDurationMonths }),
    };
    if (isManagingAgent) {
      const d = doc as {
        tenantName?: string;
        tenantLineId?: string;
        agentName?: string;
        agentLineId?: string;
        lineGroup?: string;
        contractStartDate?: Date;
        leaseDurationMonths?: number;
        contractKey?: string;
      };
      if (d.tenantName != null) payload.tenantName = d.tenantName;
      if (d.tenantLineId != null) payload.tenantLineId = d.tenantLineId;
      if (d.agentName != null) payload.agentName = d.agentName;
      if (d.agentLineId != null) payload.agentLineId = d.agentLineId;
      if (d.lineGroup != null) payload.lineGroup = d.lineGroup;
      if (d.contractStartDate != null) payload.contractStartDate = d.contractStartDate instanceof Date ? d.contractStartDate.toISOString().slice(0, 10) : String(d.contractStartDate).slice(0, 10);
      if (d.leaseDurationMonths != null) payload.leaseDurationMonths = d.leaseDurationMonths;
      if (d.contractKey != null && d.contractKey.trim() !== "") {
        payload.contractKey = d.contractKey;
        try {
          const contractUrl = await getPresignedGetUrl(d.contractKey);
          if (contractUrl) payload.contractUrl = contractUrl;
        } catch {
          // omit contractUrl on presign error
        }
      }
    }
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[GET /api/agent/property/[id]]", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to load property",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getLineUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid property id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const property = await Property.findOne({ _id: id });
    if (!property) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const agentLineId = (property as { agentLineId?: string }).agentLineId;
    if (
      agentLineId == null ||
      agentLineId.trim() === "" ||
      agentLineId !== userId
    ) {
      return NextResponse.json(
        { message: "Forbidden: only the managing agent can update this property" },
        { status: 403 }
      );
    }

    if (typeof body.tenantName === "string") property.tenantName = body.tenantName;
    if (typeof body.tenantLineId === "string") property.tenantLineId = body.tenantLineId.trim() || undefined;
    if (typeof body.agentName === "string") property.agentName = body.agentName;
    if (typeof body.agentLineId === "string") property.agentLineId = body.agentLineId.trim() || undefined;
    if (typeof body.lineGroup === "string") property.lineGroup = body.lineGroup.trim() || undefined;
    if (typeof body.description === "string") property.description = body.description;
    if (Array.isArray(body.amenities)) {
      (property as { amenities?: string[] }).amenities = (body.amenities as unknown[]).filter(
        (a): a is string => typeof a === "string"
      );
    }
    if (typeof body.contractStartDate === "string" && body.contractStartDate.trim()) {
      const d = new Date(body.contractStartDate);
      (property as { contractStartDate?: Date }).contractStartDate = Number.isNaN(d.getTime()) ? undefined : d;
    } else if (body.contractStartDate === null || body.contractStartDate === "") {
      (property as { contractStartDate?: Date }).contractStartDate = undefined;
    }
    const leaseDurationMonths =
      typeof body.leaseDurationMonths === "number"
        ? body.leaseDurationMonths
        : typeof body.leaseDurationMonths === "string"
          ? parseInt(String(body.leaseDurationMonths), 10)
          : undefined;
    if (leaseDurationMonths !== undefined && !Number.isNaN(leaseDurationMonths) && leaseDurationMonths >= 0) {
      (property as { leaseDurationMonths?: number }).leaseDurationMonths = leaseDurationMonths;
    }
    if (typeof body.contractKey === "string") {
      (property as { contractKey?: string }).contractKey = body.contractKey.trim() || undefined;
    }

    await property.save();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/agent/property/[id]]", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to update property",
      },
      { status: 500 }
    );
  }
}
