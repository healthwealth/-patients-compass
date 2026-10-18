import { describe, expect, it } from "vitest";
import { buildArticleShareLinks } from "../client/src/lib/articleSharing";

describe("article sharing links", () => {
  it("builds canonical and encoded platform URLs without inventing article data", () => {
    const links = buildArticleShareLinks({
      slug: "iron-and-energy",
      title: "Iron & Energy",
      description: "A practical overview.",
    });

    expect(links.canonicalUrl).toBe("https://thepatientscompass.com/blog/iron-and-energy");
    expect(links.x).toContain(encodeURIComponent(links.canonicalUrl));
    expect(links.linkedin).toContain(encodeURIComponent(links.canonicalUrl));
    expect(links.email).toContain("subject=Iron%20%26%20Energy");
  });
});
