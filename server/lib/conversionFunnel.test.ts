import { describe, expect, it } from "vitest";
import { buildApplicationConversionFunnel } from "./conversionFunnel";

describe("buildApplicationConversionFunnel", () => {
  it("returns aggregate-only stages and conversion rates without exposing user data", () => {
    const result = buildApplicationConversionFunnel([
      { id: 1, trialStatus: "active", subscriptionStatus: "active" },
      { id: 2, trialStatus: "converted", subscriptionStatus: "none" },
      { id: 3, trialStatus: "none", subscriptionStatus: "none" },
      { id: 4, trialStatus: "expired", subscriptionStatus: "none" },
    ], [1, 2], 30);

    expect(result).toEqual({
      periodDays: 30,
      stages: [
        { label: "New accounts", count: 4, conversionFromPrevious: 100, conversionFromStart: 100 },
        { label: "Engaged account", count: 2, conversionFromPrevious: 50, conversionFromStart: 50 },
        { label: "Active subscription", count: 1, conversionFromPrevious: 50, conversionFromStart: 25 },
      ],
    });
  });
});
