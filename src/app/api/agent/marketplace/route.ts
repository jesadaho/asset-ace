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
  const limitParam = searchParams.get("limit");
  const limit = Math.min(
    Math.max(limitParam ? parseInt(limitParam, 10) : 10, 1),
    50
  );
  const cursor = searchParams.get("cursor")?.trim() || undefined;

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

    // Cursor-based pagination: next page = docs strictly before (createdAt desc, then _id desc)
    if (cursor) {
      const parts = cursor.split("_");
      const createdAtMs = parts[0] ? parseInt(parts[0], 10) : NaN;
      const cursorId = parts.slice(1).join("_");
      if (
        !Number.isNaN(createdAtMs) &&
        cursorId &&
        /^[a-f0-9A-F]{24}$/.test(cursorId)
      ) {
        const { ObjectId } = await import("mongodb");
        filter.$or = [
          { createdAt: { $lt: new Date(createdAtMs) } },
          {
            createdAt: new Date(createdAtMs),
            _id: { $lt: new ObjectId(cursorId) },
          },
        ];
      }
    }

    const isFirstPage = !cursor;
    const totalCount = isFirstPage
      ? await Property.countDocuments(filter)
      : undefined;

    const docs = await Property.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const page = hasMore ? docs.slice(0, limit) : docs;
    const lastDoc = page[page.length - 1];
    const nextCursor =
      hasMore && lastDoc
        ? `${(lastDoc as { createdAt?: Date }).createdAt?.getTime() ?? 0}_${lastDoc._id.toString()}`
        : undefined;

    const properties = await Promise.all(
      page.map(async (doc) => {
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

    return NextResponse.json({
      properties,
      ...(totalCount !== undefined && { totalCount }),
      hasMore: !!hasMore,
      ...(nextCursor && { nextCursor }),
    });
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
