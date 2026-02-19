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
