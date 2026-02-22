import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { RentalHistory } from "@/lib/db/models/rentalHistory";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";

export async function POST(
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
    const property = await Property.findOne({ _id: propertyId, ownerId });
    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    const currentLease = await RentalHistory.findOne({
      propertyId,
      endDate: null,
    }).sort({ startDate: -1 });

    if (currentLease) {
      currentLease.endDate = new Date();
      await currentLease.save();
    } else {
      await RentalHistory.create({
        propertyId,
        tenantName: property.tenantName ?? "",
        agentName: property.agentName,
        startDate: property.contractStartDate ?? new Date(),
        endDate: new Date(),
        durationMonths: property.leaseDurationMonths ?? 0,
        contractKey: property.contractKey,
        rentPriceAtThatTime: property.price,
      });
    }

    property.status = "Available";
    property.tenantName = undefined;
    property.tenantLineId = undefined;
    property.agentName = undefined;
    property.agentLineId = undefined;
    property.contractStartDate = undefined;
    property.leaseDurationMonths = undefined;
    property.contractKey = undefined;
    await property.save();

    return NextResponse.json({ success: true, propertyId });
  } catch (err) {
    console.error("[POST /api/owner/properties/[id]/checkout]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to checkout" },
      { status: 500 }
    );
  }
}
