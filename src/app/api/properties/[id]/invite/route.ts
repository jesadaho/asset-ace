import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: "Invalid property id" },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    const doc = await Property.findOne({ _id: id })
      .select("name address type")
      .lean();
    if (!doc) {
      return NextResponse.json(
        { message: "Property not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      name: doc.name,
      address: doc.address,
      type: doc.type,
    });
  } catch (err) {
    console.error("[GET /api/properties/[id]/invite]", err);
    return NextResponse.json(
      { message: "Failed to load property" },
      { status: 500 }
    );
  }
}
