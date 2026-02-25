import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { PropertyFollow } from "@/lib/db/models/propertyFollow";
import { RentalHistory } from "@/lib/db/models/rentalHistory";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";
import { pushMessage } from "@/lib/line/push";

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
    property.reservedAt = undefined;
    property.reservedByName = undefined;
    property.reservedByContact = undefined;
    await property.save();

    const propertyName = property.name ?? "ห้อง";
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
    const detailUrl = liffId
      ? `https://liff.line.me/${liffId}/agent/property/${propertyId}`
      : "";
    const text = detailUrl
      ? `ห้อง ${propertyName} ที่คุณติดตาม กำลังว่างแล้ว! สนใจรับงานไหม? ${detailUrl}`
      : `ห้อง ${propertyName} ที่คุณติดตาม กำลังว่างแล้ว! สนใจรับงานไหม?`;
    const followers = await PropertyFollow.find({ propertyId: property._id }).lean();
    Promise.allSettled(
      followers.map((f) => pushMessage((f as { agentId: string }).agentId, text))
    ).then((results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") console.error("[checkout notify]", r.reason);
        if (r.status === "fulfilled" && !r.value.sent)
          console.error("[checkout notify]", followers[i], r.value.message);
      });
    });

    return NextResponse.json({ success: true, propertyId });
  } catch (err) {
    console.error("[POST /api/owner/properties/[id]/checkout]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to checkout" },
      { status: 500 }
    );
  }
}
