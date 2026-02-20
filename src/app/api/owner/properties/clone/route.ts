import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";

const MIN_BULK_COUNT = 2;
const MAX_BULK_COUNT = 50;

function buildClonePayload(
  source: {
    ownerId: string;
    name: string;
    type: string;
    price: number;
    address: string;
    listingType?: string;
    bedrooms?: string;
    bathrooms?: string;
    addressPrivate?: boolean;
    description?: string;
    squareMeters?: string;
    amenities?: string[];
  },
  name: string
) {
  return {
    ownerId: source.ownerId,
    name,
    type: source.type,
    status: "Draft" as const,
    price: source.price,
    address: source.address,
    imageKeys: [] as string[],
    listingType: source.listingType,
    bedrooms: source.bedrooms,
    bathrooms: source.bathrooms,
    addressPrivate: source.addressPrivate,
    description: source.description,
    squareMeters: source.squareMeters,
    amenities: source.amenities,
  };
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

  const sourceId =
    typeof body.sourceId === "string" ? body.sourceId.trim() : "";
  if (!sourceId || !mongoose.Types.ObjectId.isValid(sourceId)) {
    return NextResponse.json(
      { message: "Valid sourceId is required" },
      { status: 400 }
    );
  }

  const count =
    typeof body.count === "number"
      ? body.count
      : typeof body.count === "string"
        ? parseInt(body.count, 10)
        : undefined;

  const isBulk =
    count !== undefined &&
    Number.isInteger(count) &&
    count >= MIN_BULK_COUNT &&
    count <= MAX_BULK_COUNT;

  let unitNumbers: string[] | undefined;
  if (isBulk && Array.isArray(body.unitNumbers)) {
    unitNumbers = (body.unitNumbers as unknown[])
      .filter((u): u is string => typeof u === "string")
      .map((u) => u.trim());
    if (unitNumbers.length !== count) {
      return NextResponse.json(
        {
          message: `unitNumbers length must equal count (${count}) when provided`,
        },
        { status: 400 }
      );
    }
  }

  try {
    await connectDB();
    const source = await Property.findOne({
      _id: sourceId,
      ownerId,
    }).lean();

    if (!source) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    const sourcePayload = {
      ownerId: source.ownerId,
      name: source.name,
      type: source.type,
      price: source.price,
      address: source.address,
      listingType: source.listingType,
      bedrooms: source.bedrooms,
      bathrooms: source.bathrooms,
      addressPrivate: source.addressPrivate,
      description: source.description,
      squareMeters: source.squareMeters,
      amenities: source.amenities,
    };

    if (isBulk) {
      const toCreate = Array.from({ length: count }, (_, i) =>
        buildClonePayload(
          sourcePayload,
          unitNumbers?.[i] ?? `${source.name} (Copy ${i + 1})`
        )
      );
      const created = await Property.insertMany(toCreate);
      const properties = created.map((doc) => ({
        id: doc._id.toString(),
        name: doc.name,
      }));
      return NextResponse.json({ properties }, { status: 201 });
    }

    const newName =
      typeof body.newName === "string" ? body.newName.trim() : undefined;
    const name = newName ?? `${source.name} (Copy)`;
    const property = await Property.create(
      buildClonePayload(sourcePayload, name)
    );
    return NextResponse.json(
      { property: { id: property._id.toString(), name: property.name } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/owner/properties/clone]", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to clone property",
      },
      { status: 500 }
    );
  }
}
