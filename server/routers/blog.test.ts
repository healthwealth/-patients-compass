import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "../db";
import { blogRouter } from "./blog";

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

const getDbMock = vi.mocked(getDb);

describe("blog.getPopular", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getDbMock.mockReset();
  });

  it("returns an empty list when the copied database does not have the blog table", async () => {
    const queryFailure = new Error("Table 'blog_posts' does not exist");
    const limit = vi.fn().mockRejectedValue(queryFailure);
    const orderBy = vi.fn(() => ({ limit }));
    const where = vi.fn(() => ({ orderBy }));
    const from = vi.fn(() => ({ where }));
    const select = vi.fn(() => ({ from }));
    getDbMock.mockResolvedValue({ select } as never);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const caller = blogRouter.createCaller({} as never);
    const result = await caller.getPopular({ limit: 3 });

    expect(result).toEqual([]);
    expect(warning).toHaveBeenCalledWith(
      "[Blog] Popular articles are temporarily unavailable; returning an empty list."
    );
  });
});
