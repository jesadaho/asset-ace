import { NextRequest, NextResponse } from "next/server";
import { getPresignedPutUrls, MAX_FILES } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const raw = body.files;
    if (!Array.isArray(raw) || raw.length === 0) {
      return NextResponse.json(
        { error: "files array is required and must not be empty" },
        { status: 400 }
      );
    }
    if (raw.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    const files = raw
      .filter(
        (f: unknown): f is { name: string; type?: string } =>
          typeof f === "object" &&
          f !== null &&
          "name" in f &&
          typeof (f as { name: unknown }).name === "string"
      )
      .map((f) => ({ name: (f.name as string).trim(), type: f.type }))
      .filter((f) => f.name.length > 0);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No valid file entries" },
        { status: 400 }
      );
    }

    const uploads = await getPresignedPutUrls(files);
    if (uploads.length === 0) {
      return NextResponse.json(
        {
          error:
            "S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ uploads });
  } catch (err) {
    console.error("[upload/presign]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Presign failed" },
      { status: 500 }
    );
  }
}
