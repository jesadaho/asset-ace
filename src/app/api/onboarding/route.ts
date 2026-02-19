import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { verifyLiffToken, getBearerToken } from "@/lib/auth/liff";
import { linkRichMenuToUser } from "@/lib/line/richmenu";

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

    let richMenuDebug: { attempted: boolean; linked: boolean; status?: number; message?: string; richMenuId?: string } | undefined;
    if (role === "owner") {
      const richMenuId =
        process.env.NEXT_PUBLIC_RICH_MENU_OWNER ??
        "richmenu-14344c6c0015deec68b2f0cd48e0dc80";
      const hasToken = Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN);
      // #region agent log
      fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'richMenu',location:'onboarding/route.ts',message:'Rich Menu link attempt',data:{role,richMenuId,hasToken},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      if (hasToken) {
        const result = await linkRichMenuToUser(lineUserId, richMenuId);
        richMenuDebug = {
          attempted: true,
          linked: result.linked,
          status: result.status,
          message: result.message,
          richMenuId,
        };
        // #region agent log
        fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'richMenu',location:'onboarding/route.ts',message:'Rich Menu link result',data:{linked:result.linked,richMenuId,status:result.status},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      } else {
        richMenuDebug = { attempted: false, linked: false, message: "No channel token" };
      }
    }

    return NextResponse.json({ success: true, debug: richMenuDebug ? { richMenu: richMenuDebug } : undefined });
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
