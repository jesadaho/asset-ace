import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { PropertyFollow } from "@/lib/db/models/propertyFollow";
import { pushMessage } from "@/lib/line/push";

function getContractEndDate(startDate: Date, leaseDurationMonths: number): Date {
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + leaseDurationMonths);
  return end;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const authHeader = request.headers.get("authorization");
    const key = request.nextUrl.searchParams.get("key");
    if (authHeader !== `Bearer ${secret}` && key !== secret) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await connectDB();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const in29 = new Date(todayStart);
    in29.setDate(in29.getDate() + 29);
    const in31 = new Date(todayStart);
    in31.setDate(in31.getDate() + 31);

    const candidates = await Property.find({
      status: "Occupied",
      contractStartDate: { $exists: true, $ne: null },
      leaseDurationMonths: { $exists: true, $ne: null },
      $or: [
        { vacancyNotified30DayAt: { $exists: false } },
        { vacancyNotified30DayAt: null },
      ],
    }).lean();

    const toNotify: { id: string; name: string }[] = [];
    for (const doc of candidates) {
      const start = (doc as { contractStartDate?: Date }).contractStartDate;
      const months = (doc as { leaseDurationMonths?: number }).leaseDurationMonths;
      if (!start || months == null) continue;
      const contractEnd = getContractEndDate(
        start instanceof Date ? start : new Date(start),
        months
      );
      contractEnd.setHours(0, 0, 0, 0);
      if (contractEnd >= in29 && contractEnd <= in31) {
        toNotify.push({
          id: (doc as { _id: { toString: () => string } })._id.toString(),
          name: (doc as { name: string }).name ?? "ห้อง",
        });
      }
    }

    const liffId = process.env.NEXT_PUBLIC_LIFF_ID?.trim();
    let notified = 0;
    for (const prop of toNotify) {
      await Property.updateOne(
        { _id: prop.id },
        { $set: { vacancyNotified30DayAt: new Date() } }
      );
      const detailUrl = liffId
        ? `https://liff.line.me/${liffId}/agent/property/${prop.id}`
        : "";
      const text = detailUrl
        ? `ห้อง ${prop.name} ที่คุณติดตาม จะว่างในอีกประมาณ 30 วัน สนใจรับงานไหม? ${detailUrl}`
        : `ห้อง ${prop.name} ที่คุณติดตาม จะว่างในอีกประมาณ 30 วัน สนใจรับงานไหม?`;
      const followers = await PropertyFollow.find({
        propertyId: new mongoose.Types.ObjectId(prop.id),
      }).lean();
      for (const f of followers) {
        const result = await pushMessage((f as { agentId: string }).agentId, text);
        if (result.sent) notified++;
      }
    }

    return NextResponse.json({
      ok: true,
      propertiesChecked: candidates.length,
      propertiesNotified: toNotify.length,
      messagesSent: notified,
    });
  } catch (err) {
    console.error("[GET /api/cron/notify-vacancy-30day]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 }
    );
  }
}
