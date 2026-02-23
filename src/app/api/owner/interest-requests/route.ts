import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { AgentContactRequest } from "@/lib/db/models/agentContactRequest";
import { getLineUserIdFromRequest } from "@/lib/auth/liff";

export async function GET(request: NextRequest) {
  const ownerId = await getLineUserIdFromRequest(request);
  if (!ownerId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const requests = await AgentContactRequest.find({ ownerId })
      .sort({ requestedAt: -1 })
      .lean();

    const propertyIds = [...new Set(
      requests
        .map((r) => (r as { propertyId: mongoose.Types.ObjectId }).propertyId)
        .filter(Boolean)
    )];
    const properties = await Property.find({ _id: { $in: propertyIds } })
      .select("_id name address")
      .lean();

    const propertyMap = new Map(
      properties.map((p) => [p._id.toString(), { name: p.name, address: p.address }])
    );

    const list = requests.map((r) => {
      const doc = r as {
        _id: mongoose.Types.ObjectId;
        propertyId: mongoose.Types.ObjectId;
        agentName: string;
        agentPhone: string;
        agentLineUserId: string;
        requestedAt: Date;
      };
      const propId = doc.propertyId?.toString?.() ?? "";
      const prop = propertyMap.get(propId);
      return {
        id: doc._id?.toString?.(),
        propertyId: propId,
        propertyName: prop?.name,
        propertyAddress: prop?.address,
        agentName: doc.agentName,
        agentPhone: doc.agentPhone,
        agentLineUserId: doc.agentLineUserId,
        requestedAt: doc.requestedAt,
      };
    });

    return NextResponse.json({ requests: list });
  } catch (err) {
    console.error("[GET /api/owner/interest-requests]", err);
    return NextResponse.json(
      {
        message:
          err instanceof Error ? err.message : "Failed to load interest requests",
      },
      { status: 500 }
    );
  }
}
