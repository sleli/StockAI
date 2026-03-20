import { describe, it, expect } from "vitest";
import { isMarketOpen } from "../market-hours";

// All tests use a Monday in January 2024 (EST, UTC-5).
// 2024-01-15 is a Monday.
// To get ET time X, we create UTC time X+5h (EST offset).

describe("isMarketOpen", () => {
  it("returns true on Monday at 10:00 ET", () => {
    // 10:00 ET = 15:00 UTC
    const date = new Date("2024-01-15T15:00:00Z");
    expect(isMarketOpen(date)).toBe(true);
  });

  it("returns false on Monday at 17:00 ET", () => {
    // 17:00 ET = 22:00 UTC
    const date = new Date("2024-01-15T22:00:00Z");
    expect(isMarketOpen(date)).toBe(false);
  });

  it("returns false on Saturday at 12:00 ET", () => {
    // 2024-01-20 is a Saturday. 12:00 ET = 17:00 UTC
    const date = new Date("2024-01-20T17:00:00Z");
    expect(isMarketOpen(date)).toBe(false);
  });

  it("returns false on Friday at 9:29 ET (before open)", () => {
    // 2024-01-19 is a Friday. 9:29 ET = 14:29 UTC
    const date = new Date("2024-01-19T14:29:00Z");
    expect(isMarketOpen(date)).toBe(false);
  });

  it("returns false on Friday at 16:00 ET (market close, exclusive)", () => {
    // 2024-01-19 is a Friday. 16:00 ET = 21:00 UTC
    const date = new Date("2024-01-19T21:00:00Z");
    expect(isMarketOpen(date)).toBe(false);
  });

  it("returns true on Friday at 15:59 ET (just before close)", () => {
    // 2024-01-19 is a Friday. 15:59 ET = 20:59 UTC
    const date = new Date("2024-01-19T20:59:00Z");
    expect(isMarketOpen(date)).toBe(true);
  });

  it("returns false on Sunday", () => {
    // 2024-01-21 is a Sunday. 12:00 ET = 17:00 UTC
    const date = new Date("2024-01-21T17:00:00Z");
    expect(isMarketOpen(date)).toBe(false);
  });
});
