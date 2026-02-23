import { NextRequest, NextResponse } from "next/server";

const SIZE_2500 = { width: 2500, height: 1686 } as const;
const SIZE_1200 = { width: 1200, height: 810 } as const;

type SizeKey = "2500x1686" | "1200x810";

/** LINE Rich Menu create body (size, selected, name, chatBarText, areas). */
type RichMenuPayload = {
  size: { width: number; height: number };
  selected?: boolean;
  name: string;
  chatBarText: string;
  areas: Array<{
    bounds: { x: number; y: number; width: number; height: number };
    action: { type: string; label?: string; uri?: string; [k: string]: unknown };
  }>;
};

function isValidCustomPayload(obj: unknown): obj is RichMenuPayload {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  if (!o.size || typeof (o.size as { width?: number }).width !== "number" || typeof (o.size as { height?: number }).height !== "number") return false;
  if (!Array.isArray(o.areas)) return false;
  return true;
}

/**
 * POST /api/richmenu
 * Creates a Rich Menu via LINE API.
 * Body: { size: "2500x1686" | "1200x810" } for preset, or { customPayload: <LINE rich menu JSON> } for custom.
 * Returns { richMenuId }.
 */
export async function POST(request: NextRequest) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  // #region agent log
  fetch("http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d6e810" },
    body: JSON.stringify({
      sessionId: "d6e810",
      hypothesisId: "H3_H4",
      location: "api/richmenu/route.ts:POST",
      message: "Create rich menu entry",
      data: { hasToken: !!token?.trim(), tokenLength: token?.length ?? 0 },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
  if (!token?.trim()) {
    return NextResponse.json(
      { error: "LINE_CHANNEL_ACCESS_TOKEN is not set" },
      { status: 500 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  let body: RichMenuPayload;

  if (contentType.includes("application/json")) {
    try {
      const json = (await request.json()) as { size?: string; customPayload?: unknown };
      if (json.customPayload != null && isValidCustomPayload(json.customPayload)) {
        body = json.customPayload as RichMenuPayload;
        if (body.selected === undefined) body.selected = true;
      } else {
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";
        if (!liffId) {
          return NextResponse.json(
            { error: "NEXT_PUBLIC_LIFF_ID is not set" },
            { status: 500 }
          );
        }
        const sizeKey: SizeKey = json.size === "1200x810" || json.size === "2500x1686" ? json.size : "2500x1686";
        const baseUrl = `https://liff.line.me/${liffId}`;
        const officialId = process.env.LINE_OFFICIAL_ACCOUNT_ID?.trim() || "YOUR_OFFICIAL_ACCOUNT_ID";
        const is1200 = sizeKey === "1200x810";
        const size = is1200 ? SIZE_1200 : SIZE_2500;
        const areas = is1200
          ? [
              { bounds: { x: 0, y: 0, width: 400, height: 405 }, label: "Dashboard", uri: `${baseUrl}/owner/dashboard` },
              { bounds: { x: 400, y: 0, width: 400, height: 405 }, label: "Properties", uri: `${baseUrl}/owner/properties` },
              { bounds: { x: 800, y: 0, width: 400, height: 405 }, label: "Financials", uri: `${baseUrl}/owner/finance` },
              { bounds: { x: 0, y: 405, width: 400, height: 405 }, label: "Repairs", uri: `${baseUrl}/owner/repairs` },
              { bounds: { x: 400, y: 405, width: 400, height: 405 }, label: "Chat", uri: `https://line.me/R/oaMessage/@${officialId}/` },
              { bounds: { x: 800, y: 405, width: 400, height: 405 }, label: "Settings", uri: `${baseUrl}/owner/settings` },
            ]
          : [
              { bounds: { x: 0, y: 0, width: 834, height: 843 }, label: "Dashboard", uri: `${baseUrl}/owner/dashboard` },
              { bounds: { x: 834, y: 0, width: 833, height: 843 }, label: "Properties", uri: `${baseUrl}/owner/properties` },
              { bounds: { x: 1667, y: 0, width: 833, height: 843 }, label: "Financials", uri: `${baseUrl}/owner/finance` },
              { bounds: { x: 0, y: 843, width: 834, height: 843 }, label: "Repairs", uri: `${baseUrl}/owner/repairs` },
              { bounds: { x: 834, y: 843, width: 833, height: 843 }, label: "Chat", uri: `https://line.me/R/oaMessage/@${officialId}/` },
              { bounds: { x: 1667, y: 843, width: 833, height: 843 }, label: "Settings", uri: `${baseUrl}/owner/settings` },
            ];
        body = {
          size,
          selected: true,
          name: is1200 ? "Asset Ace Owner Menu 1200" : "Asset Ace Owner Menu",
          chatBarText: "Owner Menu",
          areas: areas.map((a) => ({ bounds: a.bounds, action: { type: "uri" as const, label: a.label, uri: a.uri } })),
        };
      }
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON body or customPayload", detail: e instanceof Error ? e.message : String(e) },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 }
    );
  }

  // LINE allows chatBarText max 14 characters
  body.chatBarText = (body.chatBarText || "Menu").slice(0, 14);

  try {
    // #region agent log
    const bodySummary = {
      size: body.size,
      areasLength: body.areas?.length ?? 0,
      firstActionType: body.areas?.[0]?.action?.type,
      name: body.name?.slice(0, 40),
    };
    fetch("http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d6e810" },
      body: JSON.stringify({
        sessionId: "d6e810",
        hypothesisId: "H2_H5",
        location: "api/richmenu/route.ts:before LINE fetch",
        message: "Request body summary",
        data: bodySummary,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    const res = await fetch("https://api.line.me/v2/bot/richmenu", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as { richMenuId?: string; message?: string; details?: string };

    // #region agent log
    fetch("http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d6e810" },
      body: JSON.stringify({
        sessionId: "d6e810",
        hypothesisId: "H1_H2_H4",
        location: "api/richmenu/route.ts:after LINE fetch",
        message: "LINE API response",
        data: {
          status: res.status,
          ok: res.ok,
          richMenuId: data.richMenuId,
          message: data.message,
          details: data.details,
          dataKeys: Object.keys(data),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (!res.ok) {
      // Visible in Vercel Function Logs when running on Vercel
      console.error("[Rich Menu] LINE API error", { status: res.status, message: data.message, details: data.details, ...data });
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
    // #region agent log
    fetch("http://127.0.0.1:7803/ingest/908fb44a-4012-43fd-b36e-e6f74cb458a6", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d6e810" },
      body: JSON.stringify({
        sessionId: "d6e810",
        hypothesisId: "H4",
        location: "api/richmenu/route.ts:catch",
        message: "Create rich menu throw",
        data: { error: message },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return NextResponse.json(
      { error: "Failed to create rich menu", detail: message },
      { status: 500 }
    );
  }
}
