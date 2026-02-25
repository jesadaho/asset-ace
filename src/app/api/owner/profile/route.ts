import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";

const PHONE_REGEX = /^[\d\s\-+()]{8,20}$/;

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && PHONE_REGEX.test(phone);
}

export async function GET(request: NextRequest) {
  const lineUserId = await getLineUserIdFromRequest(request);
  if (!lineUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findOne({
      lineUserId,
      role: "owner",
    })
      .lean()
      .exec();

    if (!user) {
      return NextResponse.json(
        { message: "Owner profile not found" },
        { status: 404 }
      );
    }

    const u = user as {
      name: string;
      phone: string;
      lineId?: string;
      paymentInfo?: string;
      notificationsEnabled?: boolean;
    };
    return NextResponse.json({
      name: u.name,
      phone: u.phone,
      lineId: u.lineId ?? "",
      paymentInfo: u.paymentInfo ?? "",
      notificationsEnabled: u.notificationsEnabled ?? true,
    });
  } catch (err) {
    console.error("[GET /api/owner/profile]", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to load profile",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const lineUserId = await getLineUserIdFromRequest(request);
  if (!lineUserId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

  const phone =
    typeof body.phone === "string" ? body.phone.trim() : undefined;
  if (phone !== undefined) {
    if (!phone) {
      return NextResponse.json(
        { message: "Phone number is required" },
        { status: 400 }
      );
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { message: "Invalid phone number" },
        { status: 400 }
      );
    }
  }

  const name =
    typeof body.name === "string" ? body.name.trim() : undefined;
  if (name !== undefined && !name) {
    return NextResponse.json(
      { message: "Display name is required" },
      { status: 400 }
    );
  }

  const paymentInfo =
    typeof body.paymentInfo === "string" ? body.paymentInfo : undefined;
  const notificationsEnabled =
    typeof body.notificationsEnabled === "boolean"
      ? body.notificationsEnabled
      : undefined;
  const lineId =
    typeof body.lineId === "string" ? body.lineId.trim() || undefined : undefined;

  try {
    await connectDB();
    const user = await User.findOne({
      lineUserId,
      role: "owner",
    }).exec();

    if (!user) {
      return NextResponse.json(
        { message: "Owner profile not found" },
        { status: 404 }
      );
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (paymentInfo !== undefined) user.paymentInfo = paymentInfo;
    if (notificationsEnabled !== undefined)
      user.notificationsEnabled = notificationsEnabled;
    if (lineId !== undefined) (user as { lineId?: string }).lineId = lineId;
    await user.save();

    return NextResponse.json({
      name: user.name,
      phone: user.phone,
      lineId: (user as { lineId?: string }).lineId ?? "",
      paymentInfo: user.paymentInfo ?? "",
      notificationsEnabled: user.notificationsEnabled ?? true,
    });
  } catch (err) {
    console.error("[PATCH /api/owner/profile]", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to update profile",
      },
      { status: 500 }
    );
  }
}
