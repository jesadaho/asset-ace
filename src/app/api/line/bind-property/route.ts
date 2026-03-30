import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { getBearerToken, verifyLiffToken } from "@/lib/auth/liff";
import { pushToGroup } from "@/lib/line/push";
import { LineBindLog } from "@/lib/db/models/lineBindLog";

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

  // LINE Messaging API groupId usually starts with "C" (e.g. Cxxxxxxxxxx).
  // If we store a wrong id (e.g. UUID-like), push/webhook lookups will fail.
  const looksLikeMessagingGroupId = /^C[0-9A-Za-z]{6,}$/.test(groupId);
  if (!looksLikeMessagingGroupId) {
    try {
      await connectDB();
      await LineBindLog.create({
        propertyId: new mongoose.Types.ObjectId(propertyId),
        groupId,
        actorLineUserId: lineUserId,
        source: "api",
        success: false,
        message: "groupId not Messaging API format",
        meta: { looksLikeMessagingGroupId },
      });
    } catch {}
    return NextResponse.json(
      {
        message:
          "groupId จาก LIFF ดูเหมือนจะไม่ใช่ Messaging API groupId (ควรขึ้นต้นด้วย C...)",
        groupId,
        hint: "ระหว่างแก้ไขชั่วคราว: พิมพ์ `/bind <propertyId>` ในกลุ่มแทน",
      },
      { status: 422 }
    );
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
      try {
        await LineBindLog.create({
          propertyId: new mongoose.Types.ObjectId(propertyId),
          groupId,
          actorLineUserId: lineUserId,
          source: "api",
          success: false,
          message: "forbidden",
        });
      } catch {}
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    (property as { lineGroupId?: string }).lineGroupId = groupId;
    await property.save();

    // Notify the group that the bind succeeded.
    try {
      const propertyName = (property as { name?: string }).name?.trim() || "ทรัพย์";
      const text =
        `เชื่อมต่อ ${propertyName} สำเร็จ! ✅\n\n` +
        `เรื่องค่าเช่าและติดตามทรัพย์ ปล่อยให้นิชาดูแลแทนได้เลยนะคะ!💚`;
      const r = await pushToGroup(groupId, text);
      if (!r.sent) {
        console.warn("[bind-property] pushToGroup failed", r.status, r.message);
      }
    } catch (e) {
      console.error("[bind-property] pushToGroup exception", e);
    }

    try {
      await LineBindLog.create({
        propertyId: (property as { _id: mongoose.Types.ObjectId })._id,
        groupId,
        actorLineUserId: lineUserId,
        source: "api",
        success: true,
        message: "bound",
      });
    } catch {}

    return NextResponse.json({ ok: true, groupId, propertyId });
  } catch (err) {
    console.error("[POST /api/line/bind-property]", err);
    try {
      await connectDB();
      await LineBindLog.create({
        propertyId: new mongoose.Types.ObjectId(propertyId),
        groupId,
        actorLineUserId: lineUserId,
        source: "api",
        success: false,
        message: err instanceof Error ? err.message : "Bind failed",
      });
    } catch {}
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Bind failed" },
      { status: 500 }
    );
  }
}

