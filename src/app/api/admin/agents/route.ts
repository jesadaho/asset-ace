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

    const docs = await User.find({ role: "agent" })
      .sort({ createdAt: -1 })
      .select("lineUserId name phone lineId createdAt")
      .lean();

    const { Property } = await import("@/lib/db/models/property");
    const counts = await Property.aggregate<{ _id: string; count: number }>([
      { $match: { agentLineId: { $exists: true, $nin: [null, ""] } } },
      { $group: { _id: "$agentLineId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id, c.count]));

    const agents = docs.map((doc) => ({
      lineUserId: doc.lineUserId,
      name: doc.name,
      phone: doc.phone,
      lineId: (doc as { lineId?: string }).lineId,
      createdAt: doc.createdAt
        ? (doc.createdAt as Date).toISOString().slice(0, 10)
        : undefined,
      assignedPropertyCount: countMap.get(doc.lineUserId) ?? 0,
    }));

    return NextResponse.json({ agents });
  } catch (err) {
    console.error("[GET /api/admin/agents]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load agents" },
      { status: 500 }
    );
  }
}
