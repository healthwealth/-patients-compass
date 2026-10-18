import { describe, expect, it } from "vitest";
import {
  decrementCooldown,
  EMAIL_LINK_COOLDOWN_SECONDS,
  MAX_OAUTH_AUTO_RETRIES,
  nextOAuthRetryCount,
  retryStatus,
  shouldAutoRetry,
} from "./authFlow";

describe("email fallback timer", () => {
  it("starts at the documented 60-second cooldown", () => {
    expect(EMAIL_LINK_COOLDOWN_SECONDS).toBe(60);
  });

  it("decrements by one and never goes below zero", () => {
    expect(decrementCooldown(60)).toBe(59);
    expect(decrementCooldown(1)).toBe(0);
    expect(decrementCooldown(0)).toBe(0);
    expect(decrementCooldown(-4)).toBe(0);
  });

  it("normalizes fractional timer values safely", () => {
    expect(decrementCooldown(3.9)).toBe(2);
  });
});

describe("automatic OAuth retry mechanism", () => {
  it("only retries transient provider failures below the retry limit", () => {
    expect(shouldAutoRetry("provider", 0)).toBe(true);
    expect(shouldAutoRetry("provider", 1)).toBe(true);
    expect(shouldAutoRetry("provider", MAX_OAUTH_AUTO_RETRIES)).toBe(false);
    expect(shouldAutoRetry("callback", 0)).toBe(false);
    expect(shouldAutoRetry(null, 0)).toBe(false);
  });

  it("increments retry counts without exceeding the limit", () => {
    expect(nextOAuthRetryCount(0)).toBe(1);
    expect(nextOAuthRetryCount(1)).toBe(2);
    expect(nextOAuthRetryCount(2)).toBe(2);
    expect(nextOAuthRetryCount(-2)).toBe(1);
  });

  it("reports pending, active, and exhausted retry states", () => {
    expect(retryStatus(0, false)).toContain("retry 1 of 2 will start shortly");
    expect(retryStatus(1, true)).toContain("retry 1 of 2 is starting");
    expect(retryStatus(2, false)).toContain("Automatic retries are complete");
  });
});
