import { describe, expect, it } from "vitest";
import { filterCoverAssets } from "../client/src/lib/coverLibrary";

const covers = [
  { title: "Visit Preparation", altText: "Appointment notes and a compass", category: "appointments" },
  { title: "Nutrition Foundations", altText: "Whole foods on a table", category: "nutrition" },
];

describe("cover library filtering", () => {
  it("searches title, alt text, and category without case sensitivity", () => {
    expect(filterCoverAssets(covers, "COMPASS", "all")).toEqual([covers[0]]);
    expect(filterCoverAssets(covers, "whole foods", "all")).toEqual([covers[1]]);
  });

  it("combines category and text filters", () => {
    expect(filterCoverAssets(covers, "visit", "appointments")).toEqual([covers[0]]);
    expect(filterCoverAssets(covers, "visit", "nutrition")).toEqual([]);
  });
});
