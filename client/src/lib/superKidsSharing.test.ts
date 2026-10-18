import { describe, expect, it } from "vitest";
import { buildPinterestShareUrl, buildSuperKidsShareMessage } from "./superKidsSharing";

describe("Super Kids sharing helpers", () => {
  it("personalizes the message only when a name is supplied", () => {
    expect(buildSuperKidsShareMessage(" Alex ")).toContain("Alex");
    expect(buildSuperKidsShareMessage(" ")).toContain("free printable activity pack");
  });

  it("includes the activity page, preview image, and encoded description for Pinterest", () => {
    const url = buildPinterestShareUrl({ pageUrl: "https://example.com/super-kids", imageUrl: "https://example.com/preview.jpg", message: "A family activity pack & certificate" });
    expect(url).toContain("https://www.pinterest.com/pin/create/button/");
    expect(url).toContain("url=https%3A%2F%2Fexample.com%2Fsuper-kids");
    expect(url).toContain("media=https%3A%2F%2Fexample.com%2Fpreview.jpg");
    expect(url).toContain("description=A%20family%20activity%20pack%20%26%20certificate");
  });
});
