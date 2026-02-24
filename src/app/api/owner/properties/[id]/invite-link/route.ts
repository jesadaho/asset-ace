import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ownerId = await getLineUserIdFromRequest(request);
  if (!ownerId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid property id" }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await Property.findOne({ _id: id, ownerId }).lean();
    if (!doc) {
      return NextResponse.json({ message: "Property not found" }, { status: 404 });
    }

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";
    if (!liffId) {
      return NextResponse.json(
        { message: "LIFF ID is not configured" },
        { status: 500 }
      );
    }

    const inviteUrl = `https://liff.line.me/${liffId}/invite?propId=${encodeURIComponent(id)}`;
    return NextResponse.json({ inviteUrl });
  } catch (err) {
    console.error("[GET /api/owner/properties/[id]/invite-link]", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to get invite link",
      },
      { status: 500 }
    );
  }
}
