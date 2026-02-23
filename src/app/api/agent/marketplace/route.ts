import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";
import { getPresignedGetUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  const userId = await getLineUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location")?.trim() || "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const minPriceNum =
    minPrice !== null && minPrice !== undefined && minPrice !== ""
      ? Number(minPrice)
      : undefined;
  const maxPriceNum =
    maxPrice !== null && maxPrice !== undefined && maxPrice !== ""
      ? Number(maxPrice)
      : undefined;

  try {
    await connectDB();

    const filter: Record<string, unknown> = { openForAgent: true };
    // Only list properties that are available for rent
    filter.status = "Available";

    if (location) {
      filter.address = { $regex: location, $options: "i" };
    }
    if (
      (minPriceNum != null && !Number.isNaN(minPriceNum)) ||
      (maxPriceNum != null && !Number.isNaN(maxPriceNum))
    ) {
      const priceCond: Record<string, number> = {};
      if (minPriceNum != null && !Number.isNaN(minPriceNum)) {
        priceCond.$gte = minPriceNum;
      }
      if (maxPriceNum != null && !Number.isNaN(maxPriceNum)) {
        priceCond.$lte = maxPriceNum;
      }
      filter.price = priceCond;
    }

    const docs = await Property.find(filter)
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
          price: doc.price,
          address: doc.address,
          imageUrl: imageUrl ?? undefined,
        };
      })
    );

    return NextResponse.json({ properties });
  } catch (err) {
    console.error("[GET /api/agent/marketplace]", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to list marketplace",
      },
      { status: 500 }
    );
  }
}
