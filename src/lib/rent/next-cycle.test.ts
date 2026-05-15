import { describe, expect, it } from "vitest";
import { getNextRentCycleSnapshot } from "./next-cycle";

function d(y: number, m: number, day: number): Date {
  return new Date(y, m - 1, day);
}

describe("getNextRentCycleSnapshot", () => {
  it("returns current due when unpaid", () => {
    const snap = getNextRentCycleSnapshot({
      contractStartDate: d(2025, 4, 14),
      lastRentPaidAt: d(2026, 3, 14),
      now: d(2026, 5, 10),
      graceDays: 30,
    });
    expect(snap?.dueDate).toBe("2026-05-14");
    expect(snap?.notifyDate).toBe("2026-06-13");
  });

  it("returns next month when current period is paid", () => {
    const snap = getNextRentCycleSnapshot({
      contractStartDate: d(2025, 4, 14),
      lastRentPaidAt: d(2026, 5, 14),
      now: d(2026, 5, 15),
      graceDays: 30,
    });
    expect(snap?.dueDate).toBe("2026-06-14");
    expect(snap?.notifyDate).toBe("2026-07-14");
  });
});
