import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";
import { getAdminLineUserId } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  const adminId = await getAdminLineUserId(request);
  if (!adminId) {
    return NextResponse.json({ message: "Admin only" }, { status: 403 });
  }

  try {
    await connectDB();

    const docs = await User.find({ role: "owner" })
      .sort({ createdAt: -1 })
      .select("lineUserId name phone createdAt")
      .lean();

    const { Property } = await import("@/lib/db/models/property");
    const counts = await Property.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$ownerId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id, c.count]));

    const owners = docs.map((doc) => ({
      lineUserId: doc.lineUserId,
      name: doc.name,
      phone: doc.phone,
      createdAt: doc.createdAt
        ? (doc.createdAt as Date).toISOString().slice(0, 10)
        : undefined,
      propertyCount: countMap.get(doc.lineUserId) ?? 0,
    }));

    return NextResponse.json({ owners });
  } catch (err) {
    console.error("[GET /api/admin/owners]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load owners" },
      { status: 500 }
    );
  }
}
