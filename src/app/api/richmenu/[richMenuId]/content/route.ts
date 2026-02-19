import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_BYTES = 1024 * 1024; // 1 MB per LINE

/**
 * POST /api/richmenu/[richMenuId]/content
 * Uploads rich menu image to LINE. Accepts raw body or multipart file.
 * Image must be 2500x1686, max 1 MB; Content-Type image/jpeg or image/png.
 */
export async function POST(
  request: NextRequest,
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

  const contentType = request.headers.get("content-type") ?? "";

  let body: ArrayBuffer;
  let finalContentType: string;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") ?? formData.get("image");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file in form (use field 'file' or 'image')" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File must be image/jpeg or image/png" },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be 1 MB or smaller" },
        { status: 400 }
      );
    }
    body = await file.arrayBuffer();
    finalContentType = file.type;
  } else if (ALLOWED_TYPES.includes(contentType.split(";")[0].trim())) {
    const raw = await request.arrayBuffer();
    if (raw.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be 1 MB or smaller" },
        { status: 400 }
      );
    }
    body = raw;
    finalContentType = contentType.split(";")[0].trim();
  } else {
    return NextResponse.json(
      { error: "Content-Type must be image/jpeg or image/png, or send multipart/form-data with a file" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://api-data.line.me/v2/bot/richmenu/${encodeURIComponent(richMenuId)}/content`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": finalContentType,
        },
        body,
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "LINE rejected the image (check size 2500x1686 and max 1 MB)",
          status: res.status,
          ...data,
        },
        { status: res.status }
      );
    }

    return new NextResponse(null, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to upload rich menu image", detail: message },
      { status: 500 }
    );
  }
}
