import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property, type IProperty } from "@/lib/db/models/property";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";
import { getPresignedGetUrl } from "@/lib/s3";

const PROPERTY_TYPES = ["Condo", "House", "Apartment"] as const;
const STATUSES = ["Available", "Occupied", "Draft"] as const;

type PropertyDoc = IProperty & { _id: mongoose.Types.ObjectId };

function toResponse(doc: PropertyDoc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    status: doc.status,
    price: doc.price,
    address: doc.address,
    imageKeys: doc.imageKeys ?? [],
    listingType: doc.listingType,
    bedrooms: doc.bedrooms,
    bathrooms: doc.bathrooms,
    addressPrivate: doc.addressPrivate,
    description: doc.description,
    squareMeters: doc.squareMeters,
    amenities: doc.amenities,
    tenantName: doc.tenantName,
    tenantLineId: doc.tenantLineId,
    agentName: doc.agentName,
    agentLineId: doc.agentLineId,
    lineGroup: doc.lineGroup,
    contractStartDate: doc.contractStartDate
      ? (doc.contractStartDate as Date).toISOString().slice(0, 10)
      : undefined,
    openForAgent: doc.openForAgent,
    publicListing: doc.publicListing,
    leaseDurationMonths: doc.leaseDurationMonths,
    contractKey: doc.contractKey,
    createdAt: doc.createdAt,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ownerId = await getLineUserIdFromRequest(request);
  if (!ownerId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid property id" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await Property.findOne({ _id: id, ownerId }).lean();
    if (!doc) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    const keys = doc.imageKeys && doc.imageKeys.length > 0 ? doc.imageKeys : [];
    const urlResults = await Promise.all(
      keys.map((key: string) => getPresignedGetUrl(key))
    );
    const imageUrls = urlResults.filter(
      (u): u is string => u != null
    );
    const docTyped = doc as unknown as PropertyDoc & { contractKey?: string };
    const contractUrl = docTyped.contractKey
      ? await getPresignedGetUrl(docTyped.contractKey)
      : undefined;
    const property = toResponse(doc as unknown as PropertyDoc);
    return NextResponse.json({
      property: {
        ...property,
        imageUrl: imageUrls[0] ?? undefined,
        imageUrls,
        contractUrl: contractUrl ?? undefined,
      },
    });
  } catch (err) {
    console.error("[GET /api/owner/properties/[id]]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load property" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ownerId = await getLineUserIdFromRequest(request);
  if (!ownerId) {
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
    const property = await Property.findOne({ _id: id, ownerId });
    if (!property) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    if (typeof body.name === "string" && body.name.trim()) property.name = body.name.trim();
    if (PROPERTY_TYPES.includes(body.type as (typeof PROPERTY_TYPES)[number])) {
      property.type = body.type as (typeof PROPERTY_TYPES)[number];
    }
    if (STATUSES.includes(body.status as (typeof STATUSES)[number])) {
      property.status = body.status as (typeof STATUSES)[number];
    }
    const price =
      typeof body.price === "number"
        ? body.price
        : typeof body.price === "string"
          ? Number(body.price)
          : undefined;
    if (price !== undefined && !Number.isNaN(price) && price >= 0) property.price = price;
    if (typeof body.address === "string") property.address = body.address.trim();
    if (Array.isArray(body.imageKeys)) {
      property.imageKeys = (body.imageKeys as unknown[]).filter(
        (k): k is string => typeof k === "string"
      );
    }
    if (typeof body.listingType === "string") property.listingType = body.listingType;
    if (typeof body.bedrooms === "string") property.bedrooms = body.bedrooms;
    if (typeof body.bathrooms === "string") property.bathrooms = body.bathrooms;
    if (typeof body.addressPrivate === "boolean") property.addressPrivate = body.addressPrivate;
    if (typeof body.description === "string") property.description = body.description;
    if (typeof body.squareMeters === "string") property.squareMeters = body.squareMeters;
    if (Array.isArray(body.amenities)) {
      property.amenities = (body.amenities as unknown[]).filter(
        (a): a is string => typeof a === "string"
      );
    }
    if (typeof body.tenantName === "string") property.tenantName = body.tenantName;
    if (typeof body.tenantLineId === "string") property.tenantLineId = body.tenantLineId || undefined;
    if (typeof body.agentName === "string") property.agentName = body.agentName;
    if (typeof body.agentLineId === "string") property.agentLineId = body.agentLineId || undefined;
    if (typeof body.lineGroup === "string") property.lineGroup = body.lineGroup || undefined;
    if (typeof body.contractStartDate === "string" && body.contractStartDate.trim()) {
      const d = new Date(body.contractStartDate);
      property.contractStartDate = Number.isNaN(d.getTime()) ? undefined : d;
    } else if (body.contractStartDate === null || body.contractStartDate === "") {
      property.contractStartDate = undefined;
    }
    if (typeof body.openForAgent === "boolean") property.openForAgent = body.openForAgent;
    if (typeof body.publicListing === "boolean") property.publicListing = body.publicListing;
    const leaseDurationMonths =
      typeof body.leaseDurationMonths === "number"
        ? body.leaseDurationMonths
        : typeof body.leaseDurationMonths === "string"
          ? parseInt(body.leaseDurationMonths, 10)
          : undefined;
    if (leaseDurationMonths !== undefined && !Number.isNaN(leaseDurationMonths) && leaseDurationMonths >= 0) {
      property.leaseDurationMonths = leaseDurationMonths;
    }
    if (typeof body.contractKey === "string") property.contractKey = body.contractKey || undefined;

    await property.save();

    const doc = property.toObject();
    const response = toResponse(doc as unknown as PropertyDoc);
    return NextResponse.json({ property: response });
  } catch (err) {
    console.error("[PATCH /api/owner/properties/[id]]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to update property" },
      { status: 500 }
    );
  }
}
