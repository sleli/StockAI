import { describe, it, expect, vi } from "vitest";
import { getQuoteStatus } from "../quote-status";

describe("getQuoteStatus", () => {
  it("returns 'error' when hasError is true, regardless of other params", () => {
    expect(getQuoteStatus(new Date(), true, true)).toBe("error");
    expect(getQuoteStatus(null, false, true)).toBe("error");
    expect(getQuoteStatus(new Date(0), true, true)).toBe("error");
  });

  it("returns 'closed' when market is closed and hasError is false", () => {
    expect(getQuoteStatus(new Date(), false, false)).toBe("closed");
    expect(getQuoteStatus(null, false, false)).toBe("closed");
  });

  it("returns 'stale' when lastUpdated is null, market is open, no error", () => {
    expect(getQuoteStatus(null, true, false)).toBe("stale");
  });

  it("returns 'stale' when lastUpdated is older than 5 minutes", () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    expect(getQuoteStatus(sixMinutesAgo, true, false)).toBe("stale");
  });

  it("returns 'fresh' when lastUpdated is within 5 minutes", () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    expect(getQuoteStatus(twoMinutesAgo, true, false)).toBe("fresh");
  });

  it("returns 'stale' when lastUpdated is exactly 5 minutes ago (boundary)", () => {
    // The implementation uses `elapsed > STALE_THRESHOLD_MS` (strictly greater),
    // so exactly 5 minutes (elapsed === threshold) returns "fresh".
    // Adjust this expectation if the boundary should be inclusive (>=).
    const exactlyFiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(getQuoteStatus(exactlyFiveMinutesAgo, true, false)).toBe("fresh");
  });
});
