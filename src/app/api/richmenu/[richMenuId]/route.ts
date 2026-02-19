import { NextResponse } from "next/server";

/**
 * DELETE /api/richmenu/[richMenuId]
 * Deletes the rich menu from LINE.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ richMenuId: string }> }
) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token?.trim()) {
    return NextResponse.json(
      { error: "LINE_CHANNEL_ACCESS_TOKEN is not set" },
      { status: 500 }
    );
  }

  const { richMenuId } = await params;
  if (!richMenuId?.trim()) {
    return NextResponse.json(
      { error: "richMenuId is required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api.line.me/v2/bot/richmenu/${encodeURIComponent(richMenuId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: "LINE API error", status: res.status, ...data },
        { status: res.status }
      );
    }

    return new NextResponse(null, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to delete rich menu", detail: message },
      { status: 500 }
    );
  }
}
