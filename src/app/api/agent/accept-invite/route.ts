import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { Property } from "@/lib/db/models/property";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";
import { pushMessage } from "@/lib/line/push";

/**
 * Accept an invite (link current agent to property).
 * For already-onboarded agents: call this instead of going through onboarding again.
 */
export async function POST(request: NextRequest) {
  const lineUserId = await getLineUserIdFromRequest(request);
  if (!lineUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: { propId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const propId = body.propId?.trim();
  if (!propId || !mongoose.Types.ObjectId.isValid(propId)) {
    return NextResponse.json(
      { message: "Valid propId is required" },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    const user = await User.findOne({
      lineUserId,
      role: "agent",
    }).lean();
    if (!user || !(user as { name?: string }).name?.trim()) {
      return NextResponse.json(
        { message: "Complete your profile first (onboarding)" },
        { status: 400 }
      );
    }

    const agentName = (user as { name: string }).name.trim();

    const updated = await Property.findOneAndUpdate(
      { _id: propId },
      {
        $set: { agentLineId: lineUserId, agentName },
        $unset: { agentInviteSentAt: "", invitedAgentName: "" },
      },
      { new: true, select: "ownerId" }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }

    const ownerId = (updated as { ownerId?: string }).ownerId;
    if (ownerId) {
      const notifyText = `Agent ${agentName} accepted your invite!`;
      pushMessage(ownerId, notifyText).catch((err) =>
        console.error("[accept-invite] Push to owner:", err)
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/agent/accept-invite]", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to accept invite",
      },
      { status: 500 }
    );
  }
}
