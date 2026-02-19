import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";
import { getPresignedGetUrl } from "@/lib/s3";

const PROPERTY_TYPES = ["Condo", "House", "Apartment"] as const;
const STATUSES = ["Available", "Occupied", "Maintenance"] as const;

export async function GET(request: NextRequest) {
  const ownerId = await getLineUserIdFromRequest(request);
  if (!ownerId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const docs = await Property.find({ ownerId })
      .sort({ createdAt: -1 })
      .lean();

    const properties = await Promise.all(
      docs.map(async (doc) => {
        const firstKey =
          doc.imageKeys && doc.imageKeys.length > 0 ? doc.imageKeys[0] : null;
        const imageUrl = firstKey
          ? await getPresignedGetUrl(firstKey)
          : null;
        return {
          id: doc._id.toString(),
          name: doc.name,
          type: doc.type,
          status: doc.status,
          price: doc.price,
          address: doc.address,
          imageUrl: imageUrl ?? undefined,
        };
      })
    );

    return NextResponse.json({ properties });
  } catch (err) {
    console.error("[GET /api/owner/properties]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to list properties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const ownerId = await getLineUserIdFromRequest(request);
  if (!ownerId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const type = body.type;
  const status = body.status;
  const price =
    typeof body.price === "number"
      ? body.price
      : typeof body.price === "string"
        ? Number(body.price)
        : NaN;
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const imageKeys = Array.isArray(body.imageKeys)
    ? (body.imageKeys as unknown[]).filter((k): k is string => typeof k === "string")
    : [];

  if (!name) {
    return NextResponse.json(
      { message: "name is required" },
      { status: 400 }
    );
  }
  if (!PROPERTY_TYPES.includes(type as (typeof PROPERTY_TYPES)[number])) {
    return NextResponse.json(
      { message: "type must be Condo, House, or Apartment" },
      { status: 400 }
    );
  }
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
    return NextResponse.json(
      { message: "status must be Available, Occupied, or Maintenance" },
      { status: 400 }
    );
  }
  if (Number.isNaN(price) || price < 0) {
    return NextResponse.json(
      { message: "price must be a non-negative number" },
      { status: 400 }
    );
  }
  if (!address) {
    return NextResponse.json(
      { message: "address is required" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const property = await Property.create({
      ownerId,
      name,
      type: type as (typeof PROPERTY_TYPES)[number],
      status: status as (typeof STATUSES)[number],
      price,
      address,
      imageKeys,
      listingType:
        typeof body.listingType === "string" ? body.listingType : undefined,
      bedrooms:
        typeof body.bedrooms === "string" ? body.bedrooms : undefined,
      bathrooms:
        typeof body.bathrooms === "string" ? body.bathrooms : undefined,
      addressPrivate:
        typeof body.addressPrivate === "boolean" ? body.addressPrivate : undefined,
      description:
        typeof body.description === "string" ? body.description : undefined,
      squareMeters:
        typeof body.squareMeters === "string" ? body.squareMeters : undefined,
      amenities: Array.isArray(body.amenities)
        ? (body.amenities as unknown[]).filter((a): a is string => typeof a === "string")
        : undefined,
      tenantName:
        typeof body.tenantName === "string" ? body.tenantName : undefined,
      tenantLineId:
        typeof body.tenantLineId === "string" ? body.tenantLineId : undefined,
      agentName:
        typeof body.agentName === "string" ? body.agentName : undefined,
      agentLineId:
        typeof body.agentLineId === "string" ? body.agentLineId : undefined,
      lineGroup:
        typeof body.lineGroup === "string" ? body.lineGroup : undefined,
      contractStartDate:
        typeof body.contractStartDate === "string" && body.contractStartDate.trim()
          ? (() => {
              const d = new Date(body.contractStartDate as string);
              return Number.isNaN(d.getTime()) ? undefined : d;
            })()
          : undefined,
    });

    return NextResponse.json(
      { property: { id: property._id.toString(), name: property.name } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/owner/properties]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to create property" },
      { status: 500 }
    );
  }
}
