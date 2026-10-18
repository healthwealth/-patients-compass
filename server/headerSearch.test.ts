import { describe, expect, it } from "vitest";
import {
  addRecentHeaderSearch,
  filterHeaderSearchDestinations,
  getSearchHighlightSegments,
  MAX_RECENT_HEADER_SEARCHES,
} from "../client/src/lib/headerSearch";

describe("header search", () => {
  it("returns a capped browse list with categories for an empty query", () => {
    const { matches, results } = filterHeaderSearchDestinations("");

    expect(matches).toHaveLength(8);
    expect(results).toHaveLength(5);
    expect(results.every((result) => Boolean(result.category))).toBe(true);
  });

  it("matches labels, categories, and keywords case-insensitively", () => {
    expect(filterHeaderSearchDestinations("FERRITIN").results[0]?.label).toBe("Biomarker Library");
    expect(filterHeaderSearchDestinations("support").results[0]?.category).toBe("Support");
  });

  it("uses reviewed lab and symptom synonyms to surface relevant destinations", () => {
    expect(filterHeaderSearchDestinations("cbc").results[0]?.label).toBe("Biomarker Library");
    expect(filterHeaderSearchDestinations("iron").results[0]?.label).toBe("Biomarker Library");
    expect(filterHeaderSearchDestinations("fatigue").results[0]?.label).toBe("Lifestyle AI");
    expect(filterHeaderSearchDestinations("cbc").synonymUsed).toBe(true);
    expect(filterHeaderSearchDestinations("ferritin").synonymUsed).toBe(false);
  });

  it("returns no results for an unknown query without mutating the query", () => {
    const query = "xyznonexistent";
    expect(filterHeaderSearchDestinations(query).results).toEqual([]);
    expect(query).toBe("xyznonexistent");
  });

  it("highlights each case-insensitive matching fragment without injecting markup", () => {
    expect(getSearchHighlightSegments("Lifestyle AI", "life")).toEqual([
      { value: "Life", matches: true },
      { value: "style AI", matches: false },
    ]);
    expect(getSearchHighlightSegments("Biomarker Library", "")).toEqual([
      { value: "Biomarker Library", matches: false },
    ]);
  });

  it("deduplicates, trims, and caps recent browser-only searches", () => {
    const searches = ["one", "two", "three", "four", "five"];
    expect(addRecentHeaderSearch(searches, " TWO ")).toEqual(["TWO", "one", "three", "four", "five"]);
    expect(addRecentHeaderSearch(searches, "six")).toHaveLength(MAX_RECENT_HEADER_SEARCHES);
    expect(addRecentHeaderSearch(searches, "   ")).toEqual(searches);
  });
});
