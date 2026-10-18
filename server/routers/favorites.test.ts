import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return { ...actual, eq: vi.fn(), and: vi.fn(), desc: vi.fn() };
});

vi.mock("../db", () => ({ getDb: vi.fn(), recordUserActivity: vi.fn() }));

import { eq } from "drizzle-orm";
import { userFavorites } from "../../drizzle/schema";
import { getDb, recordUserActivity } from "../db";
import { favoritesRouter } from "./favorites";

function resultChain(rows: unknown[]) {
  return { from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(rows) })) })) };
}

describe("favorites.save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves only an existing public article for the authenticated user and logs a generic private activity", async () => {
    const db = {
      select: vi.fn()
        .mockReturnValueOnce(resultChain([{ id: 8 }]))
        .mockReturnValueOnce(resultChain([])),
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([{ insertId: 17 }]) })),
    };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = favoritesRouter.createCaller({ user: { id: 42 } } as never);

    await expect(caller.save({ resourceType: "blog_post", resourceId: 8 })).resolves.toEqual({ favoriteId: 17, saved: true, alreadySaved: false });
    expect(recordUserActivity).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      eventType: "content_saved",
      sourceRef: "8",
    }));
  });

  it("rejects an unsupported favorite resource before querying the database", async () => {
    const caller = favoritesRouter.createCaller({ user: { id: 42 } } as never);
    await expect(caller.save({ resourceType: "article" as never, resourceId: 8 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("does not duplicate an existing private favorite or write another activity event", async () => {
    const db = {
      select: vi.fn()
        .mockReturnValueOnce(resultChain([{ id: 8 }]))
        .mockReturnValueOnce(resultChain([{ id: 17 }])),
      insert: vi.fn(),
    };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = favoritesRouter.createCaller({ user: { id: 42 } } as never);

    await expect(caller.save({ resourceType: "blog_post", resourceId: 8 })).resolves.toEqual({ favoriteId: 17, saved: true, alreadySaved: true });
    expect(db.insert).not.toHaveBeenCalled();
    expect(recordUserActivity).not.toHaveBeenCalled();
  });

  it("rejects unpublished or missing articles before creating a favorite", async () => {
    const db = { select: vi.fn().mockReturnValueOnce(resultChain([])), insert: vi.fn() };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = favoritesRouter.createCaller({ user: { id: 42 } } as never);

    await expect(caller.save({ resourceType: "blog_post", resourceId: 404 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("removes favorites only through the authenticated caller scope and records a generic removal event", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const db = { delete: vi.fn(() => ({ where })) };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = favoritesRouter.createCaller({ user: { id: 42 } } as never);

    await expect(caller.remove({ resourceType: "blog_post", resourceId: 8 })).resolves.toEqual({ saved: false });
    expect(where).toHaveBeenCalledOnce();
    expect(eq).toHaveBeenCalledWith(userFavorites.userId, 42);
    expect(recordUserActivity).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, eventType: "content_unsaved", sourceRef: "8" }));
  });

  it("lists only the authenticated user’s saved public articles", async () => {
    const expected = [{ id: 17, resourceId: 8, title: "Saved article", slug: "saved-article" }];
    const countWhere = vi.fn().mockResolvedValue([{ total: 13 }]);
    const countInnerJoin = vi.fn(() => ({ where: countWhere }));
    const pageOffset = vi.fn().mockResolvedValue(expected);
    const pageLimit = vi.fn(() => ({ offset: pageOffset }));
    const pageOrderBy = vi.fn(() => ({ limit: pageLimit }));
    const pageWhere = vi.fn(() => ({ orderBy: pageOrderBy }));
    const pageInnerJoin = vi.fn(() => ({ where: pageWhere }));
    const db = { select: vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ innerJoin: countInnerJoin })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ innerJoin: pageInnerJoin })) }) };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = favoritesRouter.createCaller({ user: { id: 42 } } as never);

    await expect(caller.list({ page: 2, pageSize: 8 })).resolves.toEqual({ items: expected, page: 2, pageSize: 8, total: 13, totalPages: 2, filters: { search: "", category: "", from: "", to: "" } });
    expect(pageLimit).toHaveBeenCalledWith(8);
    expect(pageOffset).toHaveBeenCalledWith(8);
    expect(eq).toHaveBeenCalledWith(userFavorites.userId, 42);
  });

  it("passes text, category, and saved-date filters into the protected query", async () => {
    const countWhere = vi.fn().mockResolvedValue([{ total: 0 }]);
    const countInnerJoin = vi.fn(() => ({ where: countWhere }));
    const pageOffset = vi.fn().mockResolvedValue([]);
    const pageLimit = vi.fn(() => ({ offset: pageOffset }));
    const pageOrderBy = vi.fn(() => ({ limit: pageLimit }));
    const pageWhere = vi.fn(() => ({ orderBy: pageOrderBy }));
    const pageInnerJoin = vi.fn(() => ({ where: pageWhere }));
    const db = { select: vi.fn().mockReturnValueOnce({ from: vi.fn(() => ({ innerJoin: countInnerJoin })) }).mockReturnValueOnce({ from: vi.fn(() => ({ innerJoin: pageInnerJoin })) }) };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = favoritesRouter.createCaller({ user: { id: 42 } } as never);

    await expect(caller.list({ search: "agenda", category: "patient-preparation", from: "2026-01-01", to: "2026-01-31" })).resolves.toMatchObject({ total: 0, filters: { search: "agenda", category: "patient-preparation", from: "2026-01-01", to: "2026-01-31" } });
    expect(pageLimit).toHaveBeenCalledWith(12);
  });
});
