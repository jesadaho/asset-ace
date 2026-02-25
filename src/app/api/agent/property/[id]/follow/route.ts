import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { PropertyFollow } from "@/lib/db/models/propertyFollow";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agentId = await getLineUserIdFromRequest(request);
  if (!agentId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: propertyId } = await params;
  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    return NextResponse.json({ message: "Invalid property id" }, { status: 400 });
  }

  try {
    await connectDB();
    const property = await Property.findOne({ _id: propertyId }).lean();
    if (!property) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }
    const status = (property as { status?: string }).status;
    if (status !== "Occupied") {
      return NextResponse.json(
        { message: "Can only follow properties that are currently occupied" },
        { status: 400 }
      );
    }

    const objectId = new mongoose.Types.ObjectId(propertyId);
    const existing = await PropertyFollow.findOne({ propertyId: objectId, agentId });
    if (existing) {
      await PropertyFollow.deleteOne({ _id: existing._id });
      return NextResponse.json({ following: false });
    }
    await PropertyFollow.create({ propertyId: objectId, agentId });
    return NextResponse.json({ following: true });
  } catch (err) {
    console.error("[POST /api/agent/property/[id]/follow]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to update follow" },
      { status: 500 }
    );
  }
}
