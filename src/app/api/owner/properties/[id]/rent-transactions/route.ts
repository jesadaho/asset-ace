import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { RentTransaction } from "@/lib/db/models/rentTransaction";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ownerId = await getLineUserIdFromRequest(request);
  if (!ownerId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: propertyId } = await params;
  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    return NextResponse.json({ message: "Invalid property id" }, { status: 400 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limitRaw = limitParam ? Number(limitParam) : 3;
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, limitRaw)) : 3;

  try {
    await connectDB();
    const property = await Property.findOne({ _id: propertyId, ownerId })
      .select("_id")
      .lean();
    if (!property) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    const docs = await RentTransaction.find({ propertyId })
      .sort({ slipDate: -1, createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = docs.length > limit;
    const sliced = hasMore ? docs.slice(0, limit) : docs;

    const transactions = sliced.map((d) => ({
      id: (d as { _id: mongoose.Types.ObjectId })._id.toString(),
      slipDate:
        d.slipDate instanceof Date
          ? d.slipDate.toISOString()
          : new Date(d.slipDate).toISOString(),
      amount: d.amount,
      fromName: d.fromName,
      toName: d.toName,
      status: d.status,
      remark: (d as { remark?: string }).remark,
    }));

    return NextResponse.json({ transactions, hasMore });
  } catch (err) {
    console.error("[GET /api/owner/properties/[id]/rent-transactions]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load transactions" },
      { status: 500 }
    );
  }
}

