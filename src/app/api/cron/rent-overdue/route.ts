import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";
import { Property } from "@/lib/db/models/property";
import { pushMessage, pushToGroup } from "@/lib/line/push";

const GRACE_DAYS = Number(process.env.RENT_OVERDUE_GRACE_DAYS ?? 30);

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function clampDay(year: number, monthIndex: number, day: number): number {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, last);
}

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatThaiDate(d: Date): string {
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

/** Most recent monthly due date that is strictly before `now` (start of day). */
function getLastDueDateBeforeNow(rentDueDay: number, now: Date): Date {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = clampDay(y, m, rentDueDay);
  let due = new Date(y, m, d);
  if (due >= now) {
    const pm = m === 0 ? 11 : m - 1;
    const py = m === 0 ? y - 1 : y;
    const pd = clampDay(py, pm, rentDueDay);
    due = new Date(py, pm, pd);
  }
  return startOfDay(due);
}

/**
 * Due date is computed from contractStartDate:
 * - Every month on the same day-of-month as contractStartDate (clamped to month end).
 * - Returns the most recent due date strictly before `now` (start of day), never before contractStartDate.
 */
function getLastDueDateFromContractStart(contractStartDate: Date, now: Date): Date | null {
  const start = startOfDay(contractStartDate);
  if (Number.isNaN(start.getTime())) return null;
  if (start >= now) return null;

  const startDay = start.getDate();

  // Start from current month and move backwards at most 24 months.
  let cursorY = now.getFullYear();
  let cursorM = now.getMonth();
  for (let i = 0; i < 24; i++) {
    const d = clampDay(cursorY, cursorM, startDay);
    const due = startOfDay(new Date(cursorY, cursorM, d));
    if (due < now && due >= start) return due;

    if (cursorM === 0) {
      cursorM = 11;
      cursorY -= 1;
    } else {
      cursorM -= 1;
    }
  }
  return null;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (86400 * 1000));
}

function monthKeyForDue(due: Date): string {
  return `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}`;
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
    const todayStart = startOfDay(new Date());

    const candidates = await Property.find({
      status: "Occupied",
      lineGroupId: { $exists: true, $ne: "" },
      contractStartDate: { $exists: true, $ne: null },
    }).lean();

    let notified = 0;
    let skipped = 0;

    for (const doc of candidates) {
      const contractStartDate = (doc as { contractStartDate?: Date }).contractStartDate;
      if (!contractStartDate) continue;
      const due = getLastDueDateFromContractStart(
        contractStartDate instanceof Date ? contractStartDate : new Date(contractStartDate),
        todayStart
      );
      if (!due) {
        skipped++;
        continue;
      }
      if (daysBetween(due, todayStart) < GRACE_DAYS) {
        skipped++;
        continue;
      }

      const lastPaid = (doc as { lastRentPaidAt?: Date }).lastRentPaidAt;
      const paidForPeriod =
        lastPaid != null &&
        startOfDay(lastPaid instanceof Date ? lastPaid : new Date(lastPaid)) >= due;

      if (paidForPeriod) {
        skipped++;
        continue;
      }

      const mk = monthKeyForDue(due);
      const already = (doc as { rentOverdueNotifiedForMonth?: string })
        .rentOverdueNotifiedForMonth;
      if (already === mk) {
        skipped++;
        continue;
      }

      const name = (doc as { name?: string }).name ?? "ทรัพย์";
      const groupId = (doc as { lineGroupId?: string }).lineGroupId?.trim();
      const ownerId = (doc as { ownerId?: string }).ownerId?.trim();
      const text =
        `แจ้งเตือนค่าเช่า: ${name} 🏠\n\n` +
        `ครบกำหนดชำระแล้วค่ะ (${formatThaiDate(due)})\n` +
        `(ขออภัยหากชำระเรียบร้อยแล้วค่ะ) 🙏 💚`;

      let sent = false;
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
          { $set: { rentOverdueNotifiedForMonth: mk } }
        );
        notified++;
      }
    }

    return NextResponse.json({
      ok: true,
      candidates: candidates.length,
      notified,
      skipped,
    });
  } catch (err) {
    console.error("[GET /api/cron/rent-overdue]", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 }
    );
  }
}
