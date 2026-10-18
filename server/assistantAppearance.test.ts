import { describe, expect, it } from "vitest";
import {
  DEFAULT_HEALTH_COMPANION_PORTRAIT_KEY,
  getHealthCompanionPortrait,
  HEALTH_COMPANION_PORTRAITS,
} from "../shared/assistantAppearance";

describe("Health Companion appearance options", () => {
  it("exposes multiple professional portrait options with a stable default", () => {
    expect(HEALTH_COMPANION_PORTRAITS.length).toBeGreaterThanOrEqual(5);
    expect(getHealthCompanionPortrait(DEFAULT_HEALTH_COMPANION_PORTRAIT_KEY).key).toBe(DEFAULT_HEALTH_COMPANION_PORTRAIT_KEY);
    expect(HEALTH_COMPANION_PORTRAITS.every((portrait) => portrait.url.startsWith("/manus-storage/"))).toBe(true);
    expect(HEALTH_COMPANION_PORTRAITS.every((portrait) => portrait.altText.includes("Health Companion"))).toBe(true);
  });

  it("falls back safely for an unknown or missing key", () => {
    expect(getHealthCompanionPortrait("unknown").key).toBe(DEFAULT_HEALTH_COMPANION_PORTRAIT_KEY);
    expect(getHealthCompanionPortrait(null).key).toBe(DEFAULT_HEALTH_COMPANION_PORTRAIT_KEY);
  });
});
