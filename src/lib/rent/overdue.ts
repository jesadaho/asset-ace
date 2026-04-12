/**
 * Rent overdue detection (aligned with /api/cron/rent-overdue).
 * Due dates follow contractStartDate day-of-month (clamped to month end).
 */

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function clampDay(year: number, monthIndex: number, day: number): number {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, last);
}

/**
 * Most recent due date strictly before `now` (start of day), never before contractStartDate.
 */
export function getLastDueDateFromContractStart(
  contractStartDate: Date,
  now: Date
): Date | null {
  const start = startOfDay(contractStartDate);
  if (Number.isNaN(start.getTime())) return null;
  const todayStart = startOfDay(now);
  if (start >= todayStart) return null;

  const startDay = start.getDate();

  let cursorY = todayStart.getFullYear();
  let cursorM = todayStart.getMonth();
  for (let i = 0; i < 24; i++) {
    const d = clampDay(cursorY, cursorM, startDay);
    const due = startOfDay(new Date(cursorY, cursorM, d));
    if (due < todayStart && due >= start) return due;

    if (cursorM === 0) {
      cursorM = 11;
      cursorY -= 1;
    } else {
      cursorM -= 1;
    }
  }
  return null;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (86400 * 1000));
}

/** YYYY-MM for the calendar month of `due` (used for legacy DB field migration). */
export function monthKeyForDue(due: Date): string {
  return `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}`;
}

/** Calendar date in Asia/Bangkok as YYYY-MM-DD (for daily notification dedupe). */
export function bangkokDateKey(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export type RentOverdueSnapshot = {
  isOverdue: boolean;
  /** YYYY-MM-DD (local date parts of `due`, not timezone-shifted) */
  dueDate: string | null;
  graceDays: number;
  /** Whole days from due (start-of-day) to now (start-of-day). */
  daysAfterDue: number;
  /** max(0, daysAfterDue - graceDays); meaningful when past grace. */
  daysPastGrace: number;
};

export function getRentOverdueSnapshot(args: {
  contractStartDate: Date;
  lastRentPaidAt?: Date | null;
  now: Date;
  graceDays: number;
}): RentOverdueSnapshot {
  const { contractStartDate, lastRentPaidAt, now, graceDays } = args;
  const todayStart = startOfDay(now);
  const due = getLastDueDateFromContractStart(contractStartDate, todayStart);

  if (!due) {
    return {
      isOverdue: false,
      dueDate: null,
      graceDays,
      daysAfterDue: 0,
      daysPastGrace: 0,
    };
  }

  const daysAfterDue = daysBetween(due, todayStart);
  const lastPaid = lastRentPaidAt
    ? startOfDay(
        lastRentPaidAt instanceof Date ? lastRentPaidAt : new Date(lastRentPaidAt)
      )
    : null;
  const paidForPeriod = lastPaid != null && lastPaid >= due;

  if (paidForPeriod || daysAfterDue < graceDays) {
    return {
      isOverdue: false,
      dueDate: toYmdLocal(due),
      graceDays,
      daysAfterDue,
      daysPastGrace: Math.max(0, daysAfterDue - graceDays),
    };
  }

  return {
    isOverdue: true,
    dueDate: toYmdLocal(due),
    graceDays,
    daysAfterDue,
    daysPastGrace: Math.max(0, daysAfterDue - graceDays),
  };
}

function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
