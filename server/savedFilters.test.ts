import { describe, expect, it } from "vitest";
import { buildSavedFiltersQuery, isSavedFiltersExpired, parseSavedFilters } from "../client/src/lib/savedFilters";

describe("saved content URL filters", () => {
  it("encodes active filters and a future optional expiry", () => {
    const expiresAt = Date.now() + 60 * 60 * 1000;
    const query = buildSavedFiltersQuery({ search: " lab agenda ", category: "patient-preparation", from: "2026-01-01", to: "2026-01-31", expiresAt });
    expect(query).toContain("q=lab+agenda");
    expect(query).toContain("topic=patient-preparation");
    expect(query).toContain("exp=");
  });
  it("restores shared filter state from a URL query", () => {
    expect(parseSavedFilters("?q=lab+agenda&topic=patient-preparation&from=2026-01-01&to=2026-01-31", Date.parse("2025-01-01"))).toMatchObject({ search: "lab agenda", category: "patient-preparation", from: "2026-01-01", to: "2026-01-31" });
  });
  it("clears filters when a share link has expired", () => {
    const now = Date.parse("2026-02-01T00:00:00Z");
    const parsed = parseSavedFilters("?q=private+topic&exp=1769904000", now);
    expect(parsed.search).toBe("");
    expect(parsed.category).toBe("");
    expect(isSavedFiltersExpired(parsed.expiresAt, now)).toBe(true);
  });
  it("clears the query when all filters are reset", () => {
    expect(buildSavedFiltersQuery({ search: "", category: "", from: "", to: "", expiresAt: null })).toBe("");
  });
});
