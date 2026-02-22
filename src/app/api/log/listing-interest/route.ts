import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";

const PLATFORMS = [
  "Facebook Marketplace",
  "DDproperty",
  "Livinginsider",
  "DotProperty",
] as const;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const platform = typeof body.platform === "string" ? body.platform.trim() : "";
  if (!PLATFORMS.includes(platform as (typeof PLATFORMS)[number])) {
    return NextResponse.json(
      { message: "Invalid platform" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const collection = mongoose.connection.collection("listinginterestlogs");
    await collection.insertOne({
      platform,
      timestamp: new Date(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[POST /api/log/listing-interest]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to log" },
      { status: 500 }
    );
  }
}
