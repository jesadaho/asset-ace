import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { verifyLiffToken, getBearerToken } from "@/lib/auth/liff";

const ROLES = ["owner", "agent", "tenant"] as const;

async function getLineUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = getBearerToken(authHeader);
  return verifyLiffToken(token);
}

export async function GET(request: NextRequest) {
  const lineUserId = await getLineUserId(request);
  if (!lineUserId) {
    return NextResponse.json({ onboarded: false }, { status: 200 });
  }

  try {
    await connectDB();
    const user = await User.findOne({ lineUserId });
    if (!user?.role) {
      return NextResponse.json({ onboarded: false }, { status: 200 });
    }
    return NextResponse.json({
      onboarded: true,
      role: user.role,
    });
  } catch {
    return NextResponse.json({ onboarded: false }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  const lineUserId = await getLineUserId(request);
  if (!lineUserId) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: { role?: string; name?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { role, name, phone } = body;
  if (!role || !name?.trim() || !phone?.trim()) {
    return NextResponse.json(
      { message: "role, name, and phone are required" },
      { status: 400 }
    );
  }

  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    return NextResponse.json(
      { message: "Invalid role" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    await User.findOneAndUpdate(
      { lineUserId },
      {
        lineUserId,
        name: name.trim(),
        phone: phone.trim(),
        role: role as (typeof ROLES)[number],
      },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("Onboarding POST error:", err);
    return NextResponse.json(
      {
        message: "Failed to save onboarding data",
        detail,
      },
      { status: 500 }
    );
  }
}
