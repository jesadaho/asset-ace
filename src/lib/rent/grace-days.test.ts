import { afterEach, describe, expect, it } from "vitest";
import { getRentOverdueGraceDays } from "./grace-days";

describe("getRentOverdueGraceDays", () => {
  afterEach(() => {
    delete process.env["RENT_OVERDUE_GRACE_DAYS"];
  });

  it("returns 3 when env is 3 (not 33)", () => {
    process.env["RENT_OVERDUE_GRACE_DAYS"] = "3";
    expect(getRentOverdueGraceDays()).toBe(3);
  });

  it("defaults to 30 when unset", () => {
    expect(getRentOverdueGraceDays()).toBe(30);
  });

  it("ignores empty string", () => {
    process.env["RENT_OVERDUE_GRACE_DAYS"] = "";
    expect(getRentOverdueGraceDays()).toBe(30);
  });
});
