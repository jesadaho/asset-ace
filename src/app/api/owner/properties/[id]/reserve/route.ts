import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { PropertyFollow } from "@/lib/db/models/propertyFollow";
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const reservedByName =
    typeof body.reservedByName === "string"
      ? body.reservedByName.trim() || undefined
      : undefined;
  const reservedByContact =
    typeof body.reservedByContact === "string"
      ? body.reservedByContact.trim() || undefined
      : undefined;

  try {
    await connectDB();
    const property = await Property.findOne({ _id: propertyId, ownerId });
    if (!property) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }
    if (property.status !== "Available") {
      return NextResponse.json(
        { message: "Property must be Available to reserve" },
        { status: 400 }
      );
    }

    property.reservedAt = new Date();
    property.reservedByName = reservedByName;
    property.reservedByContact = reservedByContact;
    await property.save();

    const propertyName = property.name ?? "ห้อง";
    const text = `ห้อง ${propertyName} ที่คุณติดตาม ถูกจองแล้ว ไม่ต้องหาต่อ`;
    const followers = await PropertyFollow.find({ propertyId: property._id }).lean();
    Promise.allSettled(
      followers.map((f) => pushMessage((f as { agentId: string }).agentId, text))
    ).then((results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") console.error("[reserve notify]", r.reason);
        if (r.status === "fulfilled" && !r.value.sent)
          console.error("[reserve notify]", followers[i], r.value.message);
      });
    });

    return NextResponse.json({ success: true, propertyId });
  } catch (err) {
    console.error("[POST /api/owner/properties/[id]/reserve]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to reserve" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    property.reservedAt = undefined;
    property.reservedByName = undefined;
    property.reservedByContact = undefined;
    await property.save();

    return NextResponse.json({ success: true, propertyId });
  } catch (err) {
    console.error("[DELETE /api/owner/properties/[id]/reserve]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to clear reservation" },
      { status: 500 }
    );
  }
}
