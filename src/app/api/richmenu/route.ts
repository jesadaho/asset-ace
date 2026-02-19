import { NextResponse } from "next/server";

/**
 * POST /api/richmenu
 * Creates the Owner Rich Menu (6-button, 2500x1686) via LINE API.
 * Uses NEXT_PUBLIC_LIFF_ID and optional LINE_OFFICIAL_ACCOUNT_ID from env.
 * Returns { richMenuId }.
 */
export async function POST() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token?.trim()) {
    return NextResponse.json(
      { error: "LINE_CHANNEL_ACCESS_TOKEN is not set" },
      { status: 500 }
    );
  }

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";
  if (!liffId) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_LIFF_ID is not set" },
      { status: 500 }
    );
  }

  const baseUrl = `https://liff.line.me/${liffId}`;
  const officialId =
    process.env.LINE_OFFICIAL_ACCOUNT_ID?.trim() || "YOUR_OFFICIAL_ACCOUNT_ID";

  const body = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "Asset Ace Owner Menu",
    chatBarText: "Owner Menu",
    areas: [
      {
        bounds: { x: 0, y: 0, width: 834, height: 843 },
        action: {
          type: "uri",
          label: "Dashboard",
          uri: `${baseUrl}/owner/dashboard`,
        },
      },
      {
        bounds: { x: 834, y: 0, width: 833, height: 843 },
        action: {
          type: "uri",
          label: "Properties",
          uri: `${baseUrl}/owner/properties`,
        },
      },
      {
        bounds: { x: 1667, y: 0, width: 833, height: 843 },
        action: {
          type: "uri",
          label: "Financials",
          uri: `${baseUrl}/owner/finance`,
        },
      },
      {
        bounds: { x: 0, y: 843, width: 834, height: 843 },
        action: {
          type: "uri",
          label: "Repairs",
          uri: `${baseUrl}/owner/repairs`,
        },
      },
      {
        bounds: { x: 834, y: 843, width: 833, height: 843 },
        action: {
          type: "uri",
          label: "Chat",
          uri: `https://line.me/R/oaMessage/@${officialId}/`,
        },
      },
      {
        bounds: { x: 1667, y: 843, width: 833, height: 843 },
        action: {
          type: "uri",
          label: "Settings",
          uri: `${baseUrl}/owner/settings`,
        },
      },
    ],
  };

  try {
    const res = await fetch("https://api.line.me/v2/bot/richmenu", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as { richMenuId?: string; message?: string };

    if (!res.ok) {
      return NextResponse.json(
        { error: "LINE API error", status: res.status, ...data },
        { status: res.status }
      );
    }

    if (!data.richMenuId) {
      return NextResponse.json(
        { error: "LINE did not return richMenuId", ...data },
        { status: 500 }
      );
    }

    return NextResponse.json({ richMenuId: data.richMenuId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to create rich menu", detail: message },
      { status: 500 }
    );
  }
}
