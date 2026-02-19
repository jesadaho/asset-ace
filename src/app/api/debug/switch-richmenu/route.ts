import { NextRequest, NextResponse } from "next/server";
import { debugSwitchRichMenu, type DebugRichMenuTarget } from "@/lib/line/richmenu";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const target = body.target === "onboarding" || body.target === "owner" ? body.target : undefined;

    if (!userId || !target) {
      return NextResponse.json(
        { error: "userId (string) and target ('onboarding' | 'owner') are required" },
        { status: 400 }
      );
    }

    const result = await debugSwitchRichMenu(userId, target as DebugRichMenuTarget);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, linked: false }, { status: 500 });
  }
}
