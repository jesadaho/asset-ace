export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function clampDay(year: number, monthIndex: number, day: number): number {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, last);
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Due date is computed from contractStartDate:
 * - Every month on the same day-of-month as contractStartDate (clamped to month end).
 * - Returns the most recent due date that is <= `at` (start-of-day), never before contractStartDate.
 */
export function getDueDateOnOrBefore(
  contractStartDate: Date,
  at: Date
): Date | null {
  const start = startOfDay(contractStartDate);
  if (Number.isNaN(start.getTime())) return null;
  const target = startOfDay(at);
  if (target < start) return null;

  const startDay = start.getDate();
  let cursorY = target.getFullYear();
  let cursorM = target.getMonth();

  for (let i = 0; i < 48; i++) {
    const d = clampDay(cursorY, cursorM, startDay);
    const due = startOfDay(new Date(cursorY, cursorM, d));
    if (due <= target && due >= start) return due;

    if (cursorM === 0) {
      cursorM = 11;
      cursorY -= 1;
    } else {
      cursorM -= 1;
    }
  }
  return null;
}

/**
 * Returns the next due date that is > `after` (start-of-day), never before contractStartDate.
 */
export function getNextDueDateAfter(
  contractStartDate: Date,
  after: Date
): Date | null {
  const start = startOfDay(contractStartDate);
  if (Number.isNaN(start.getTime())) return null;
  const target = startOfDay(after);

  const startDay = start.getDate();
  let cursorY = target.getFullYear();
  let cursorM = target.getMonth();

  for (let i = 0; i < 48; i++) {
    const d = clampDay(cursorY, cursorM, startDay);
    const due = startOfDay(new Date(cursorY, cursorM, d));
    if (due > target && due >= start) return due;

    if (cursorM === 11) {
      cursorM = 0;
      cursorY += 1;
    } else {
      cursorM += 1;
    }
  }
  return null;
}

/**
 * Map a slip date to a rent period key (YYYY-MM) based on contractStartDate cycle.
 * Convention: periodKey is the month of the due date that is on-or-before the slip date.
 */
export function periodKeyFromSlipDate(
  contractStartDate: Date,
  slipDate: Date
): string | null {
  const due = getDueDateOnOrBefore(contractStartDate, slipDate);
  if (!due) return null;
  return monthKey(due);
}

const TH_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

/**
 * Due calendar day in the month of `periodKey` (YYYY-MM), using the same
 * day-of-month rule as the rent cycle (clamped to month length).
 */
export function dueDateInPeriodMonth(
  contractStartDate: Date,
  periodKey: string
): Date | null {
  const m = /^(\d{4})-(\d{2})$/.exec(periodKey);
  if (!m) return null;
  const y = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  if (Number.isNaN(y) || monthIndex < 0 || monthIndex > 11) return null;
  const start = startOfDay(contractStartDate);
  if (Number.isNaN(start.getTime())) return null;
  const day = start.getDate();
  const d = clampDay(y, monthIndex, day);
  const due = startOfDay(new Date(y, monthIndex, d));
  return Number.isNaN(due.getTime()) ? null : due;
}

/** Thai label e.g. "รอบวันที่ 26 ก.พ. (เก็บทุกเดือน)" for bill UI. */
export function billCycleDescription(
  contractStartDate: Date,
  periodKey: string
): string | null {
  const due = dueDateInPeriodMonth(contractStartDate, periodKey);
  if (!due) return null;
  const day = due.getDate();
  const label = TH_MONTHS_SHORT[due.getMonth()];
  if (!label) return null;
  return `รอบวันที่ ${day} ${label} (เก็บทุกเดือน)`;
}
