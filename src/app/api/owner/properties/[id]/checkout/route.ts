import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { RentalHistory } from "@/lib/db/models/rentalHistory";
import { User } from "@/lib/db/models/user";
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

  let moveOutDateStr: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    moveOutDateStr =
      typeof (body as { moveOutDate?: string }).moveOutDate === "string"
        ? (body as { moveOutDate: string }).moveOutDate.trim()
        : undefined;
  } catch {
    // no body or invalid JSON
  }

  const endDate =
    moveOutDateStr && /^\d{4}-\d{2}-\d{2}$/.test(moveOutDateStr)
      ? new Date(moveOutDateStr + "T00:00:00.000Z")
      : new Date();
  if (isNaN(endDate.getTime())) {
    return NextResponse.json(
      { message: "Invalid moveOutDate format (use YYYY-MM-DD)" },
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

    const currentLease = await RentalHistory.findOne({
      propertyId,
      endDate: null,
    }).sort({ startDate: -1 });

    if (currentLease) {
      currentLease.endDate = endDate;
      await currentLease.save();
    } else {
      await RentalHistory.create({
        propertyId,
        tenantName: property.tenantName ?? "",
        agentName: property.agentName,
        startDate: property.contractStartDate ?? new Date(),
        endDate,
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
    (property as { agentLineAccountId?: string }).agentLineAccountId = undefined;
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
    const d = endDate.getUTCDate();
    const m = endDate.getUTCMonth() + 1;
    const y = endDate.getUTCFullYear() + 543;
    const dateLabel = `${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${y}`;
    const text = detailUrl
      ? `ห้อง ${propertyName} กำลังว่างแล้ว (วันที่ย้ายออก/คืนห้อง: ${dateLabel}) สนใจรับงานไหม? ${detailUrl}`
      : `ห้อง ${propertyName} กำลังว่างแล้ว (วันที่ย้ายออก/คืนห้อง: ${dateLabel}) สนใจรับงานไหม?`;
    const agents = await User.find({ role: "agent" })
      .select("lineUserId")
      .lean();
    const agentIds = agents
      .map((a) => (a as { lineUserId?: string }).lineUserId)
      .filter((id): id is string => Boolean(id?.trim()));
    Promise.allSettled(agentIds.map((id) => pushMessage(id, text))).then(
      (results) => {
        results.forEach((r, i) => {
          if (r.status === "rejected")
            console.error("[checkout notify]", r.reason);
          if (r.status === "fulfilled" && !r.value.sent)
            console.error(
              "[checkout notify]",
              agentIds[i],
              r.value.message
            );
        });
      }
    );

    return NextResponse.json({ success: true, propertyId });
  } catch (err) {
    console.error("[POST /api/owner/properties/[id]/checkout]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to checkout" },
      { status: 500 }
    );
  }
}
