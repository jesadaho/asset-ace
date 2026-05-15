import {
  billCycleDescription,
  getDueDateOnOrBefore,
  getNextDueDateAfter,
  monthKey,
  startOfDay,
} from "@/lib/rent/period";

function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addCalendarDays(d: Date, days: number): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() + days);
  return x;
}

export type NextRentCycleSnapshot = {
  /** YYYY-MM-DD */
  dueDate: string;
  periodKey: string;
  cycleLabel: string | null;
  /** First calendar day LINE overdue reminder may send (due + graceDays). */
  notifyDate: string;
  graceDays: number;
};

/**
 * Next rent collection cycle for owner UI (aligned with contractStartDate billing).
 * If the current period is already paid, returns the following due date.
 */
export function getNextRentCycleSnapshot(args: {
  contractStartDate: Date;
  lastRentPaidAt?: Date | null;
  now?: Date;
  graceDays: number;
}): NextRentCycleSnapshot | null {
  const { contractStartDate, lastRentPaidAt, graceDays } = args;
  const today = startOfDay(args.now ?? new Date());
  const start = startOfDay(contractStartDate);
  if (Number.isNaN(start.getTime())) return null;

  let nextDue: Date | null = null;

  if (today < start) {
    nextDue = start;
  } else {
    const currentDue = getDueDateOnOrBefore(contractStartDate, today);
    if (!currentDue) return null;

    const lastPaid = lastRentPaidAt
      ? startOfDay(
          lastRentPaidAt instanceof Date ? lastRentPaidAt : new Date(lastRentPaidAt)
        )
      : null;
    const paidForCurrent = lastPaid != null && lastPaid >= currentDue;

    if (paidForCurrent) {
      nextDue = getNextDueDateAfter(contractStartDate, currentDue);
    } else {
      nextDue = currentDue;
    }
  }

  if (!nextDue || Number.isNaN(nextDue.getTime())) return null;

  const periodKey = monthKey(nextDue);
  const notifyAt = addCalendarDays(nextDue, graceDays);

  return {
    dueDate: toYmdLocal(nextDue),
    periodKey,
    cycleLabel: billCycleDescription(contractStartDate, periodKey),
    notifyDate: toYmdLocal(notifyAt),
    graceDays,
  };
}
