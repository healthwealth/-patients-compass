import { describe, expect, it } from "vitest";
import { buildSitemapXml } from "./handlers/sitemapHandler";

describe("dynamic sitemap", () => {
  it("includes canonical static routes and published article URLs with safe XML escaping", () => {
    const sitemap = buildSitemapXml([
      {
        slug: "understanding-cbc-and-ferritin",
        publishedAt: new Date("2026-08-01T00:00:00.000Z"),
        updatedAt: new Date("2026-08-14T00:00:00.000Z"),
      },
      { slug: "lab&wellness", publishedAt: null, updatedAt: null },
    ]);

    expect(sitemap).toContain("https://thepatientscompass.com/blog");
    expect(sitemap).toContain("https://thepatientscompass.com/super-kids");
    expect(sitemap).toContain("https://thepatientscompass.com/manus-storage/Healthy_Habits_Super_Kids_Free_Printables_8b45bee6.pdf");
    expect(sitemap).toContain("https://thepatientscompass.com/features");
    expect(sitemap).toContain("https://thepatientscompass.com/blog/understanding-cbc-and-ferritin");
    expect(sitemap).toContain("<lastmod>2026-08-14</lastmod>");
    expect(sitemap).toContain("https://thepatientscompass.com/blog/lab&amp;wellness");
  });
});
