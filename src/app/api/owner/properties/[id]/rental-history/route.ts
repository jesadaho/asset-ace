import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { RentalHistory } from "@/lib/db/models/rentalHistory";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";
import { getPresignedGetUrl } from "@/lib/s3";

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

  try {
    await connectDB();
    const property = await Property.findOne({ _id: propertyId, ownerId }).lean();
    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    const docs = await RentalHistory.find({ propertyId })
      .sort({ startDate: -1 })
      .lean();

    const history = await Promise.all(
      docs.map(async (d) => {
        const contractUrl = d.contractKey
          ? await getPresignedGetUrl(d.contractKey)
          : undefined;
        return {
          id: (d as { _id: mongoose.Types.ObjectId })._id.toString(),
          tenantName: d.tenantName,
          agentName: d.agentName,
          startDate: d.startDate instanceof Date ? d.startDate.toISOString().slice(0, 10) : d.startDate,
          endDate: d.endDate
            ? d.endDate instanceof Date
              ? d.endDate.toISOString().slice(0, 10)
              : d.endDate
            : null,
          durationMonths: d.durationMonths,
          contractKey: d.contractKey,
          contractUrl: contractUrl ?? undefined,
          rentPriceAtThatTime: d.rentPriceAtThatTime,
        };
      })
    );

    return NextResponse.json({ history });
  } catch (err) {
    console.error("[GET /api/owner/properties/[id]/rental-history]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load rental history" },
      { status: 500 }
    );
  }
}
