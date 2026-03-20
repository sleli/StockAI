import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RateLimiter } from "../rate-limiter";

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows 8 consecutive calls with default config", () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < 8; i++) {
      expect(limiter.tryConsume()).toBe(true);
    }
  });

  it("rejects the 9th call when tokens are exhausted", () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < 8; i++) {
      limiter.tryConsume();
    }
    expect(limiter.tryConsume()).toBe(false);
  });

  it("refills tokens after time passes", () => {
    const limiter = new RateLimiter();
    // Exhaust all tokens
    for (let i = 0; i < 8; i++) {
      limiter.tryConsume();
    }
    expect(limiter.tryConsume()).toBe(false);

    // Advance time by the full refill interval (60s)
    vi.advanceTimersByTime(60000);

    // Tokens should be refilled
    expect(limiter.tryConsume()).toBe(true);
  });

  it("works with custom config (maxTokens=2, refillInterval=10000)", () => {
    const limiter = new RateLimiter(2, 10000);

    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.tryConsume()).toBe(false);

    // Advance 10 seconds to refill
    vi.advanceTimersByTime(10000);

    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.tryConsume()).toBe(true);
    expect(limiter.tryConsume()).toBe(false);
  });

  it("getRetryAfterSeconds returns a positive number when exhausted", () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < 8; i++) {
      limiter.tryConsume();
    }
    const retryAfter = limiter.getRetryAfterSeconds();
    expect(retryAfter).toBeGreaterThan(0);
  });
});
