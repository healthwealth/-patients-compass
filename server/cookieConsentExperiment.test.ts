import { describe, expect, it } from "vitest";
import {
  COOKIE_COPY_VARIANTS,
  resolveCookieCopyVariant,
} from "../client/src/lib/cookieConsentExperiment";

describe("cookie consent copy experiment", () => {
  it("preserves a previously assigned valid copy variant", () => {
    expect(resolveCookieCopyVariant("standard", 0.9)).toBe("standard");
    expect(resolveCookieCopyVariant("concise", 0.1)).toBe("concise");
  });

  it("assigns deterministic variants for new visitors", () => {
    expect(resolveCookieCopyVariant(null, 0.2)).toBe("standard");
    expect(resolveCookieCopyVariant(null, 0.8)).toBe("concise");
  });

  it("keeps both variants informative without adding personal data", () => {
    expect(COOKIE_COPY_VARIANTS.standard).toContain("essential cookies");
    expect(COOKIE_COPY_VARIANTS.concise).toContain("Essential cookies");
  });
});
