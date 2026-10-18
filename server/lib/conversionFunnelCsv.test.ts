import { describe, expect, it } from "vitest";
import { buildConversionFunnelCsv } from "../../shared/conversionFunnelCsv";

describe("buildConversionFunnelCsv", () => {
  it("exports aggregate stage metrics with a period header and escaped cells only", () => {
    const csv = buildConversionFunnelCsv({ periodDays: 30, stages: [{ label: "New, accounts", count: 10, conversionFromPrevious: 100, conversionFromStart: 100 }] });
    expect(csv).toContain('"Reporting window: last 30 days"');
    expect(csv).toContain('"New, accounts","10","100","100"');
    expect(csv).not.toContain("userId");
  });
});
