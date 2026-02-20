import { NextResponse } from "next/server";

/**
 * GET /api/richmenu/list
 * Fetches the list of Rich Menus from LINE using LINE_CHANNEL_ACCESS_TOKEN.
 * Use this to see the exact richMenuId values returned by LINE for your account.
 */
export async function GET() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token?.trim()) {
    return NextResponse.json(
      { error: "LINE_CHANNEL_ACCESS_TOKEN is not set" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/richmenu/list", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));

    // #region agent log
    const richmenus = (data as { richmenus?: unknown[] }).richmenus ?? [];
    fetch('http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d6e810'},body:JSON.stringify({sessionId:'d6e810',hypothesisId:'H2_H3',location:'api/richmenu/list/route.ts',message:'LINE richmenu list response',data:{ok:res.ok,status:res.status,richmenusLength:richmenus.length,richMenuIds:richmenus.map((m: { richMenuId?: string }) => m?.richMenuId),responseKeys:Object.keys(data as object)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    if (!res.ok) {
      return NextResponse.json(
        { error: "LINE API error", status: res.status, ...data },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to fetch rich menu list", detail: message },
      { status: 500 }
    );
  }
}
