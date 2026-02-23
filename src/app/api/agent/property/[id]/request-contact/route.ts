import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { User } from "@/lib/db/models/user";
import { AgentContactRequest } from "@/lib/db/models/agentContactRequest";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const agentLineUserId = await getLineUserIdFromRequest(request);
  if (!agentLineUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: propertyId } = await params;
  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  try {
    await connectDB();

    const agent = await User.findOne({
      lineUserId: agentLineUserId,
      role: "agent",
    })
      .lean()
      .exec();

    if (!agent || !(agent as { name?: string }).name?.trim() || !(agent as { phone?: string }).phone?.trim()) {
      return NextResponse.json(
        {
          message: "Complete your profile first",
          code: "PROFILE_INCOMPLETE",
        },
        { status: 400 }
      );
    }

    const doc = await Property.findOne({ _id: propertyId }).lean();
    if (!doc) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const ownerId = (doc as { ownerId: string }).ownerId;
    if (!ownerId) {
      return NextResponse.json({ message: "Property owner not found" }, { status: 404 });
    }

    const owner = await User.findOne({ lineUserId: ownerId }).lean().exec();
    if (!owner) {
      return NextResponse.json({ message: "Owner profile not found" }, { status: 404 });
    }

    await AgentContactRequest.findOneAndUpdate(
      { propertyId: new mongoose.Types.ObjectId(propertyId), agentLineUserId },
      {
        propertyId: new mongoose.Types.ObjectId(propertyId),
        agentLineUserId,
        agentName: (agent as { name: string }).name.trim(),
        agentPhone: (agent as { phone: string }).phone.trim(),
        ownerId,
        requestedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const ownerName = (owner as { name: string }).name ?? "";
    const ownerPhone = (owner as { phone: string }).phone ?? "";
    const ownerLineUserId = (owner as { lineUserId: string }).lineUserId;

    return NextResponse.json({
      success: true,
      ownerContact: {
        name: ownerName,
        phone: ownerPhone,
        lineUserId: ownerLineUserId,
      },
      lineChatUrl: `https://line.me/R/ti/p/${encodeURIComponent(ownerLineUserId)}`,
    });
  } catch (err) {
    console.error("[POST /api/agent/property/[id]/request-contact]", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to request contact",
      },
      { status: 500 }
    );
  }
}
