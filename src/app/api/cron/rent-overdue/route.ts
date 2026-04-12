import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { pushMessage, pushToGroup } from "@/lib/line/push";
import {
  bangkokDateKey,
  getRentOverdueSnapshot,
  monthKeyForDue,
  startOfDay,
} from "@/lib/rent/overdue";

const GRACE_DAYS = Number(process.env.RENT_OVERDUE_GRACE_DAYS ?? 30);

function formatThaiDate(d: Date): string {
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export async function GET(request: NextRequest) {
  const startedAt = new Date();
  console.warn("[cron/rent-overdue] start", {
    at: startedAt.toISOString(),
    graceDays: GRACE_DAYS,
    hasSecret: Boolean(process.env.CRON_SECRET?.trim()),
    hasKeyParam: Boolean(request.nextUrl.searchParams.get("key")),
    hasAuthHeader: Boolean(request.headers.get("authorization")),
  });

  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const authHeader = request.headers.get("authorization");
    const key = request.nextUrl.searchParams.get("key");
    if (authHeader !== `Bearer ${secret}` && key !== secret) {
      console.warn("[cron/rent-overdue] unauthorized", {
        at: startedAt.toISOString(),
        hasKeyParam: Boolean(key),
        hasAuthHeader: Boolean(authHeader),
      });
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await connectDB();
    const todayStart = startOfDay(new Date());
    const todayBangkok = bangkokDateKey();
    console.warn("[cron/rent-overdue] connected", {
      at: startedAt.toISOString(),
      todayStart: todayStart.toISOString(),
      todayBangkok,
    });

    const candidates = await Property.find({
      status: "Occupied",
      lineGroupId: { $exists: true, $ne: "" },
      contractStartDate: { $exists: true, $ne: null },
    }).lean();

    let notified = 0;
    let skipped = 0;
    let skippedNoDue = 0;
    let skippedGrace = 0;
    let skippedPaid = 0;
    let skippedAlreadyNotified = 0;
    let skippedMigrationBump = 0;
    let skippedNoContract = 0;
    let attempted = 0;

    for (const doc of candidates) {
      const contractStartDate = (doc as { contractStartDate?: Date }).contractStartDate;
      if (!contractStartDate) {
        skippedNoContract++;
        skipped++;
        continue;
      }

      const csd =
        contractStartDate instanceof Date
          ? contractStartDate
          : new Date(contractStartDate);
      const lastPaidRaw = (doc as { lastRentPaidAt?: Date }).lastRentPaidAt;
      const lastPaid =
        lastPaidRaw != null
          ? lastPaidRaw instanceof Date
            ? lastPaidRaw
            : new Date(lastPaidRaw)
          : undefined;

      const snap = getRentOverdueSnapshot({
        contractStartDate: csd,
        lastRentPaidAt: lastPaid,
        now: todayStart,
        graceDays: GRACE_DAYS,
      });

      if (!snap.dueDate) {
        skippedNoDue++;
        skipped++;
        continue;
      }

      const due = new Date(snap.dueDate + "T12:00:00");
      if (Number.isNaN(due.getTime())) {
        skippedNoDue++;
        skipped++;
        continue;
      }

      if (!snap.isOverdue) {
        const dueForPaid = new Date(snap.dueDate + "T12:00:00");
        const lp = lastPaid ? startOfDay(lastPaid) : null;
        const paidOk =
          lp != null &&
          !Number.isNaN(dueForPaid.getTime()) &&
          lp >= startOfDay(dueForPaid);
        if (paidOk) {
          skippedPaid++;
        } else if (snap.daysAfterDue < GRACE_DAYS) {
          skippedGrace++;
        }
        skipped++;
        continue;
      }

      const mk = monthKeyForDue(due);
      const lastNotifiedDay = (doc as { rentOverdueLastNotifiedDay?: string })
        .rentOverdueLastNotifiedDay?.trim();
      const legacyMonth = (doc as { rentOverdueNotifiedForMonth?: string })
        .rentOverdueNotifiedForMonth?.trim();

      if (lastNotifiedDay === todayBangkok) {
        skippedAlreadyNotified++;
        skipped++;
        continue;
      }

      if (!lastNotifiedDay && legacyMonth === mk) {
        await Property.updateOne(
          { _id: (doc as { _id: mongoose.Types.ObjectId })._id },
          { $set: { rentOverdueLastNotifiedDay: todayBangkok } }
        );
        skippedMigrationBump++;
        skipped++;
        continue;
      }

      const name = (doc as { name?: string }).name ?? "ทรัพย์";
      const groupId = (doc as { lineGroupId?: string }).lineGroupId?.trim();
      const ownerId = (doc as { ownerId?: string }).ownerId?.trim();
      const text =
        `อย่าลืมชำระค่าเช่าด้วยนะ \n` +
        `[${name}] 🏠\n\n` +
        `ครบกำหนดชำระแล้ว (${formatThaiDate(due)})\n` +
        `(ขออภัยหากชำระเรียบร้อยแล้วค่ะ) 🙏 💚`;

      let sent = false;
      attempted++;
      if (groupId) {
        const r = await pushToGroup(groupId, text);
        sent = r.sent;
      }
      if (!sent && ownerId) {
        const r2 = await pushMessage(ownerId, text);
        sent = r2.sent;
      }

      if (sent) {
        await Property.updateOne(
          { _id: (doc as { _id: mongoose.Types.ObjectId })._id },
          { $set: { rentOverdueLastNotifiedDay: todayBangkok } }
        );
        notified++;
      }
    }

    if (attempted === 0) {
      console.error("[cron/rent-overdue] no-outgoing-requests", {
        at: startedAt.toISOString(),
        candidates: candidates.length,
        attempted,
        notified,
        skipped,
        skippedNoContract,
        skippedNoDue,
        skippedGrace,
        skippedPaid,
        skippedAlreadyNotified,
        skippedMigrationBump,
      });
    }

    console.warn("[cron/rent-overdue] done", {
      at: startedAt.toISOString(),
      candidates: candidates.length,
      attempted,
      notified,
      skipped,
      skippedNoContract,
      skippedNoDue,
      skippedGrace,
      skippedPaid,
      skippedAlreadyNotified,
      skippedMigrationBump,
    });

    return NextResponse.json({
      ok: true,
      candidates: candidates.length,
      attempted,
      notified,
      skipped,
      skippedNoContract,
      skippedNoDue,
      skippedGrace,
      skippedPaid,
      skippedAlreadyNotified,
      skippedMigrationBump,
    });
  } catch (err) {
    console.error("[GET /api/cron/rent-overdue]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 }
    );
  }
}
