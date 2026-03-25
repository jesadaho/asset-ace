import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { getBearerToken, verifyLiffToken } from "@/lib/auth/liff";

type Body = {
  propertyId?: string;
  groupId?: string;
};

export async function POST(request: NextRequest) {
  const token = getBearerToken(request.headers.get("authorization"));
  const lineUserId = await verifyLiffToken(token);
  if (!lineUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const propertyId = typeof body.propertyId === "string" ? body.propertyId.trim() : "";
  const groupId = typeof body.groupId === "string" ? body.groupId.trim() : "";
  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    return NextResponse.json({ message: "Invalid propertyId" }, { status: 400 });
  }
  if (!groupId) {
    return NextResponse.json({ message: "groupId is required" }, { status: 400 });
  }

  try {
    await connectDB();

    const taken = await Property.findOne({ lineGroupId: groupId })
      .select("_id")
      .lean();
    if (taken && (taken as { _id: mongoose.Types.ObjectId })._id.toString() !== propertyId) {
      return NextResponse.json(
        { message: "This group is already bound to another property" },
        { status: 409 }
      );
    }

    // Owner OR managing agent can bind.
    const property = await Property.findOne({
      _id: propertyId,
      $or: [{ ownerId: lineUserId }, { agentLineId: lineUserId }],
    });
    if (!property) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    (property as { lineGroupId?: string }).lineGroupId = groupId;
    await property.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/line/bind-property]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Bind failed" },
      { status: 500 }
    );
  }
}

