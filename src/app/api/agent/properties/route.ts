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

  try {
    await connectDB();
    const docs = await Property.find({ agentLineId: userId })
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
    console.error("[GET /api/agent/properties]", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to list properties",
      },
      { status: 500 }
    );
  }
}
