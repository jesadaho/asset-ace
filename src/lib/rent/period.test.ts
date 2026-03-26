import { describe, expect, it } from "vitest";
import {
  billCycleDescription,
  dueDateInPeriodMonth,
  getDueDateOnOrBefore,
  periodKeyFromSlipDate,
} from "./period";

function d(y: number, m1: number, day: number): Date {
  // Use noon local time to avoid DST edge cases in tests.
  return new Date(y, m1 - 1, day, 12, 0, 0, 0);
}

describe("periodKeyFromSlipDate (contractStartDate cycle)", () => {
  it("uses due date on-or-before slip date (same day counts)", () => {
    const contractStart = d(2026, 1, 15);
    const slip = d(2026, 3, 15);
    expect(periodKeyFromSlipDate(contractStart, slip)).toBe("2026-03");
  });

  it("maps to previous period when slip is before this month's due day", () => {
    const contractStart = d(2026, 1, 15);
    const slip = d(2026, 3, 1);
    expect(periodKeyFromSlipDate(contractStart, slip)).toBe("2026-02");
  });

  it("clamps due day at month end (Jan 31 -> Feb 28/29)", () => {
    const contractStart = d(2026, 1, 31);
    expect(periodKeyFromSlipDate(contractStart, d(2026, 2, 1))).toBe("2026-01");
    expect(periodKeyFromSlipDate(contractStart, d(2026, 2, 28))).toBe("2026-02");
  });

  it("returns null when slip date is before contract start", () => {
    const contractStart = d(2026, 3, 10);
    const slip = d(2026, 3, 1);
    expect(periodKeyFromSlipDate(contractStart, slip)).toBeNull();
  });
});

describe("getDueDateOnOrBefore", () => {
  it("returns the due date on-or-before the target date", () => {
    const contractStart = d(2026, 1, 15);
    const due = getDueDateOnOrBefore(contractStart, d(2026, 4, 20));
    expect(due?.getFullYear()).toBe(2026);
    expect(due?.getMonth()).toBe(3); // April (0-indexed)
    expect(due?.getDate()).toBe(15);
  });

  it("handles clamping for months without the start day", () => {
    const contractStart = d(2026, 1, 31);
    const due = getDueDateOnOrBefore(contractStart, d(2026, 2, 27));
    expect(due?.getMonth()).toBe(0); // Jan
    expect(due?.getDate()).toBe(31);
  });
});

describe("dueDateInPeriodMonth / billCycleDescription", () => {
  it("returns due day in the period month from contract cycle", () => {
    const contractStart = d(2026, 1, 26);
    const due = dueDateInPeriodMonth(contractStart, "2026-02");
    expect(due?.getFullYear()).toBe(2026);
    expect(due?.getMonth()).toBe(1);
    expect(due?.getDate()).toBe(26);
  });

  it("formats Thai bill cycle label", () => {
    const contractStart = d(2026, 1, 26);
    expect(billCycleDescription(contractStart, "2026-02")).toBe(
      "รอบวันที่ 26 ก.พ. (เก็บทุกเดือน)"
    );
  });
});
