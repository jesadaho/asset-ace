import { NextRequest, NextResponse } from "next/server";
import {
  debugSwitchRichMenu,
  linkRichMenuToUser,
  type DebugRichMenuTarget,
} from "@/lib/line/richmenu";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const richMenuId =
      typeof body.richMenuId === "string" ? body.richMenuId.trim() : "";
    const target =
      body.target === "onboarding" || body.target === "owner"
        ? body.target
        : undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "userId (string) is required" },
        { status: 400 }
      );
    }

    if (richMenuId) {
      const result = await linkRichMenuToUser(userId, richMenuId);
      return NextResponse.json(result);
    }
    if (target) {
      const result = await debugSwitchRichMenu(
        userId,
        target as DebugRichMenuTarget
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      {
        error:
          "Either richMenuId (string) or target ('onboarding' | 'owner') is required",
      },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, linked: false }, { status: 500 });
  }
}
