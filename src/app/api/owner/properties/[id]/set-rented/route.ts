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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const tenantName = typeof body.tenantName === "string" ? body.tenantName.trim() : "";
  const tenantLineId = typeof body.tenantLineId === "string" ? body.tenantLineId.trim() || undefined : undefined;
  const agentName = typeof body.agentName === "string" ? body.agentName.trim() || undefined : undefined;
  const contractStartDateRaw = typeof body.contractStartDate === "string" ? body.contractStartDate.trim() : "";
  const leaseDurationMonths =
    typeof body.leaseDurationMonths === "number"
      ? body.leaseDurationMonths
      : typeof body.leaseDurationMonths === "string"
        ? parseInt(body.leaseDurationMonths, 10)
        : NaN;
  const contractKey = typeof body.contractKey === "string" ? body.contractKey.trim() || undefined : undefined;
  const rentPriceAtThatTime =
    typeof body.rentPriceAtThatTime === "number"
      ? body.rentPriceAtThatTime
      : typeof body.rentPriceAtThatTime === "string"
        ? Number(body.rentPriceAtThatTime)
        : NaN;

  if (!tenantName) {
    return NextResponse.json(
      { message: "tenantName is required" },
      { status: 400 }
    );
  }
  if (!contractStartDateRaw) {
    return NextResponse.json(
      { message: "contractStartDate is required" },
      { status: 400 }
    );
  }
  const startDate = new Date(contractStartDateRaw);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json(
      { message: "Invalid contractStartDate" },
      { status: 400 }
    );
  }
  if (!Number.isInteger(leaseDurationMonths) || leaseDurationMonths < 1) {
    return NextResponse.json(
      { message: "leaseDurationMonths must be a positive integer" },
      { status: 400 }
    );
  }
  if (Number.isNaN(rentPriceAtThatTime) || rentPriceAtThatTime < 0) {
    return NextResponse.json(
      { message: "rentPriceAtThatTime must be a non-negative number" },
      { status: 400 }
    );
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

    await RentalHistory.create({
      propertyId,
      tenantName,
      agentName,
      startDate,
      endDate: null,
      durationMonths: leaseDurationMonths,
      contractKey,
      rentPriceAtThatTime,
    });

    property.status = "Occupied";
    property.tenantName = tenantName;
    property.tenantLineId = tenantLineId;
    property.agentName = agentName;
    property.contractStartDate = startDate;
    property.leaseDurationMonths = leaseDurationMonths;
    property.contractKey = contractKey;
    property.reservedAt = undefined;
    property.reservedByName = undefined;
    property.reservedByContact = undefined;
    await property.save();

    return NextResponse.json({ success: true, propertyId });
  } catch (err) {
    console.error("[POST /api/owner/properties/[id]/set-rented]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to set as rented" },
      { status: 500 }
    );
  }
}
