import { describe, expect, it } from "vitest";
import {
  getInitials,
  getSubscriptionBadge,
} from "../client/src/lib/dashboardPresentation";

describe("dashboard presentation contracts", () => {
  it("uses a Google user's name for resilient avatar initials", () => {
    expect(getInitials("Sonya Morgan", "sonya@example.com")).toBe("SM");
    expect(getInitials(null, "patient@example.com")).toBe("P");
  });

  it("labels active monthly and yearly subscriptions explicitly", () => {
    expect(getSubscriptionBadge("active", "monthly").label).toBe("Monthly Pro");
    expect(getSubscriptionBadge("active", "yearly").label).toBe("Yearly Pro");
    expect(getSubscriptionBadge("free", null).label).toBe("Free plan");
  });

  it("does not expose a sample activity fixture once the dashboard uses persisted user events", async () => {
    const presentation = await import("../client/src/lib/dashboardPresentation");
    expect("SAMPLE_RECENT_ACTIVITY" in presentation).toBe(false);
  });
});
