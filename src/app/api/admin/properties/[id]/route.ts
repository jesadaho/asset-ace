import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { User } from "@/lib/db/models/user";
import { getPresignedGetUrl } from "@/lib/s3";
import { getAdminLineUserId } from "@/lib/auth/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminId = await getAdminLineUserId(request);
  if (!adminId) {
    return NextResponse.json({ message: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid property id" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await Property.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    const owner = await User.findOne({ lineUserId: doc.ownerId })
      .select("name")
      .lean();
    const ownerName = owner?.name ?? "—";

    const keys = doc.imageKeys && doc.imageKeys.length > 0 ? doc.imageKeys : [];
    const urlResults = await Promise.all(
      keys.map((key: string) => getPresignedGetUrl(key))
    );
    const imageUrls = urlResults.filter((u): u is string => u != null);

    const property = {
      id: doc._id.toString(),
      name: doc.name,
      type: doc.type,
      status: doc.status,
      price: doc.price,
      address: doc.address,
      ownerName,
      ownerId: doc.ownerId,
      agentName: doc.agentName ?? undefined,
      agentLineId: doc.agentLineId ?? undefined,
      imageUrl: imageUrls[0],
      imageUrls,
      listingType: doc.listingType,
      bedrooms: doc.bedrooms,
      bathrooms: doc.bathrooms,
      description: doc.description,
      tenantName: doc.tenantName,
      contractStartDate: doc.contractStartDate
        ? (doc.contractStartDate as Date).toISOString().slice(0, 10)
        : undefined,
      createdAt: doc.createdAt,
    };

    return NextResponse.json({ property });
  } catch (err) {
    console.error("[GET /api/admin/properties/[id]]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load property" },
      { status: 500 }
    );
  }
}
