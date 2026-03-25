import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { getBearerToken, verifyLiffToken } from "@/lib/auth/liff";
import { Property } from "@/lib/db/models/property";
import { BindCode } from "@/lib/db/models/bindCode";

const TTL_MINUTES = 10;

type Body = { propertyId?: string };

function random6(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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
  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    return NextResponse.json({ message: "Invalid propertyId" }, { status: 400 });
  }

  try {
    await connectDB();

    // Owner OR managing agent can request a bind code.
    const property = await Property.findOne({
      _id: propertyId,
      $or: [{ ownerId: lineUserId }, { agentLineId: lineUserId }],
    }).select("_id name").lean();
    if (!property) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Try a few times to avoid rare collisions.
    const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);
    let code: string | null = null;
    for (let i = 0; i < 6; i++) {
      const c = random6();
      const exists = await BindCode.findOne({ code: c }).select("_id").lean();
      if (!exists) {
        code = c;
        break;
      }
    }
    if (!code) {
      return NextResponse.json({ message: "Failed to generate code" }, { status: 500 });
    }

    await BindCode.create({
      code,
      propertyId: (property as { _id: mongoose.Types.ObjectId })._id,
      createdByLineUserId: lineUserId,
      expiresAt,
    });

    return NextResponse.json({
      ok: true,
      code,
      expiresAt: expiresAt.toISOString(),
      propertyName: (property as { name?: string }).name ?? "",
    });
  } catch (err) {
    console.error("[POST /api/line/bind-code]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

