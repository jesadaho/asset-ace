import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { User } from "@/lib/db/models/user";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";

export async function GET(request: NextRequest) {
  const userId = await getLineUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const [totalProperties, activeOwners, totalAgents, pendingMaintenance] =
      await Promise.all([
        Property.countDocuments(),
        User.countDocuments({ role: "owner" }),
        User.countDocuments({ role: "agent" }),
        Property.countDocuments({ status: "Maintenance" }),
      ]);

    return NextResponse.json({
      totalProperties,
      activeOwners,
      totalAgents,
      pendingMaintenance,
    });
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load stats" },
      { status: 500 }
    );
  }
}
