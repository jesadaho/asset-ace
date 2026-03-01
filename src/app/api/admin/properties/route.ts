import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { User } from "@/lib/db/models/user";
import { getAdminLineUserId } from "@/lib/auth/admin";

const STATUSES = ["Available", "Occupied", "Draft"] as const;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  const adminId = await getAdminLineUserId(request);
  if (!adminId) {
    return NextResponse.json({ message: "Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status")?.trim();
  const agentAssigned = searchParams.get("agentAssigned"); // "yes" | "no" | ""

  try {
    await connectDB();

    const conditions: Record<string, unknown>[] = [];

    if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
      conditions.push({ status });
    }

    if (agentAssigned === "yes") {
      conditions.push({
        $or: [
          { agentName: { $exists: true, $nin: [null, ""] } },
          { agentLineId: { $exists: true, $nin: [null, ""] } },
        ],
      });
    } else if (agentAssigned === "no") {
      conditions.push({
        $and: [
          { $or: [{ agentName: { $in: [null, ""] } }, { agentName: { $exists: false } }] },
          { $or: [{ agentLineId: { $in: [null, ""] } }, { agentLineId: { $exists: false } }] },
        ],
      });
    }

    if (search) {
      const ownerDocs = await User.find({
        role: "owner",
        name: new RegExp(escapeRegex(search), "i"),
      })
        .select("lineUserId")
        .lean();
      const ownerIdList = ownerDocs.map((u) => u.lineUserId);
      conditions.push({
        $or: [
          { name: new RegExp(escapeRegex(search), "i") },
          { ownerId: { $in: ownerIdList } },
        ],
      });
    }

    const query = conditions.length > 0 ? { $and: conditions } : {};
    const docs = await Property.find(query).sort({ createdAt: -1 }).lean();
    const ownerIds = [...new Set(docs.map((d) => d.ownerId))];
    const users = await User.find({ lineUserId: { $in: ownerIds } })
      .select("lineUserId name")
      .lean();
    const ownerMap = new Map(users.map((u) => [u.lineUserId, u.name]));

    const properties = docs.map((doc) => {
      const start = doc.contractStartDate as Date | undefined;
      const months = (doc as { leaseDurationMonths?: number }).leaseDurationMonths;
      let contractPeriod: string | undefined;
      if (start && months != null && months > 0) {
        const end = new Date(start);
        end.setMonth(end.getMonth() + months);
        contractPeriod = `${(start as Date).toISOString().slice(0, 10)} – ${end.toISOString().slice(0, 10)}`;
      } else if (start) {
        contractPeriod = (start as Date).toISOString().slice(0, 10);
      }

      return {
        id: doc._id.toString(),
        name: doc.name,
        ownerName: ownerMap.get(doc.ownerId) ?? "—",
        assignedAgent: doc.agentName ?? "—",
        location: doc.address,
        status: doc.status,
        contractPeriod: contractPeriod ?? "—",
      };
    });

    return NextResponse.json({ properties });
  } catch (err) {
    console.error("[GET /api/admin/properties]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Failed to list properties" },
      { status: 500 }
    );
  }
}
