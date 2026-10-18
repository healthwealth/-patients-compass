import { afterEach, describe, expect, it, vi } from "vitest";
import { trackHeaderSearchFeedback, trackHeaderSearchZeroResults, trackNotFoundRecoverySelection } from "../client/src/lib/gtm";

const originalWindow = globalThis.window;

afterEach(() => {
  Object.defineProperty(globalThis, "window", { value: originalWindow, configurable: true });
});

describe("header search zero-result analytics", () => {
  it("sends only the aggregate event name and search surface", () => {
    const dataLayer: Record<string, unknown>[] = [];
    Object.defineProperty(globalThis, "window", { value: { dataLayer }, configurable: true });

    trackHeaderSearchZeroResults("mobile");

    expect(dataLayer).toContainEqual({ event: "header_search_zero_results", surface: "mobile" });
    expect(dataLayer[0]).not.toHaveProperty("search_term");
    expect(dataLayer[0]).not.toHaveProperty("user_id");
  });

  it("records aggregate relevance feedback without query or destination data", () => {
    const dataLayer: Record<string, unknown>[] = [];
    Object.defineProperty(globalThis, "window", { value: { dataLayer }, configurable: true });

    trackHeaderSearchFeedback("helpful", "desktop", 3);

    expect(dataLayer).toContainEqual({
      event: "header_search_feedback",
      feedback: "helpful",
      surface: "desktop",
      result_count: 3,
    });
    expect(dataLayer[0]).not.toHaveProperty("search_term");
    expect(dataLayer[0]).not.toHaveProperty("destination");
  });

  it("records guided 404 selections without a missing path, query, or destination URL", () => {
    const dataLayer: Record<string, unknown>[] = [];
    Object.defineProperty(globalThis, "window", { value: { dataLayer }, configurable: true });

    trackNotFoundRecoverySelection("search_result", "Library");

    expect(dataLayer).toContainEqual({
      event: "not_found_recovery_selection",
      selection_source: "search_result",
      destination_category: "Library",
    });
    expect(dataLayer[0]).not.toHaveProperty("search_term");
    expect(dataLayer[0]).not.toHaveProperty("missing_path");
    expect(dataLayer[0]).not.toHaveProperty("destination_url");
  });
});
