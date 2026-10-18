import { describe, expect, it } from "vitest";
import { buildRelatedRecommendations } from "../client/src/lib/articleRecommendations";

describe("related article recommendations", () => {
  it("keeps primary related content first and fills missing slots from the article category", () => {
    const recommendations = buildRelatedRecommendations(
      [{ slug: "primary" }],
      [{ slug: "current" }, { slug: "primary" }, { slug: "category-two" }, { slug: "category-three" }],
      "current",
      3,
    );

    expect(recommendations.map((article) => article.slug)).toEqual(["primary", "category-two", "category-three"]);
  });
});
