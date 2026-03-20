/**
 * Token bucket rate limiter (in-memory).
 * Default: 8 tokens/minute for Twelve Data free tier.
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(maxTokens = 8, refillIntervalMs = 60000) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = maxTokens / refillIntervalMs;
  }

  tryConsume(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  getRetryAfterSeconds(): number {
    const tokensNeeded = 1 - this.tokens;
    const msNeeded = tokensNeeded / this.refillRate;
    return Math.ceil(msNeeded / 1000);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const newTokens = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + newTokens);
    this.lastRefill = now;
  }
}
