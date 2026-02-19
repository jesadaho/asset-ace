import { NextRequest, NextResponse } from "next/server";
import { uploadToS3, MAX_FILES } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const bucket = process.env.AWS_S3_BUCKET?.trim();
    const region = process.env.AWS_REGION;
    console.log("📤 S3 Upload (proxy) - Bucket:", bucket ?? "(not set)", "Region:", region ?? "(not set)");

    const formData = await request.formData();
    const entries = Array.from(formData.entries()).filter(
      (e): e is [string, File] => e[1] instanceof File
    );
    const files = entries.map(([, file]) => file).filter((f) => f.size > 0);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files in request. Send multipart/form-data with file field(s)." },
        { status: 400 }
      );
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    const uploads: { key: string }[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const contentType = file.type?.trim() || "image/jpeg";
      const result = await uploadToS3(buffer, file.name, contentType);
      if (!result) {
        return NextResponse.json(
          {
            error:
              "S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and AWS_S3_BUCKET.",
          },
          { status: 503 }
        );
      }
      uploads.push(result);
    }

    return NextResponse.json({
      uploads,
      bucketName: bucket ?? null,
    });
  } catch (err) {
    const bucket = process.env.AWS_S3_BUCKET?.trim();
    const region = process.env.AWS_REGION;
    console.error("[upload]", err);
    const rawMessage = err instanceof Error ? err.message : "Upload failed";
    const isRegionError = /must be addressed using the specified endpoint|The specified bucket does not exist|Wrong region/i.test(rawMessage);
    const error = isRegionError
      ? `S3 region mismatch: set AWS_REGION to the region where your bucket was created (e.g. ap-southeast-1, us-east-1). Current: ${region ?? "not set"}.`
      : rawMessage;
    return NextResponse.json(
      { error, bucketName: bucket ?? null },
      { status: 500 }
    );
  }
}
