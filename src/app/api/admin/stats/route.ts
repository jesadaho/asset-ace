import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { User } from "@/lib/db/models/user";
import { getAdminLineUserId } from "@/lib/auth/admin";

export async function GET(request: NextRequest) {
  const adminId = await getAdminLineUserId(request);
  if (!adminId) {
    return NextResponse.json({ message: "Admin only" }, { status: 403 });
  }

  try {
    await connectDB();

    const [totalProperties, activeOwners, totalAgents] =
      await Promise.all([
        Property.countDocuments(),
        User.countDocuments({ role: "owner" }),
        User.countDocuments({ role: "agent" }),
      ]);

    return NextResponse.json({
      totalProperties,
      activeOwners,
      totalAgents,
    });
  } catch (err) {
    console.error("[GET /api/admin/stats]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to load stats" },
      { status: 500 }
    );
  }
}
