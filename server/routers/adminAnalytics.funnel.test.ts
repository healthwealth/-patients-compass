import { describe, expect, it } from "vitest";
import { adminAnalyticsRouter } from "./adminAnalytics";

describe("adminAnalytics.getConversionFunnel", () => {
  it("rejects a non-admin caller before any aggregate data can be read", async () => {
    const caller = adminAnalyticsRouter.createCaller({ user: { id: 42, role: "user" } } as never);
    await expect(caller.getConversionFunnel({ days: 30 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
