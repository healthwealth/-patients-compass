import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return { ...actual, and: vi.fn(), eq: vi.fn(), desc: vi.fn(), asc: vi.fn() };
});
vi.mock("../db", () => ({ getDb: vi.fn(), recordUserActivity: vi.fn() }));
vi.mock("../storage", () => ({ storagePut: vi.fn() }));

import { eq } from "drizzle-orm";
import { userCollectionFollows } from "../../drizzle/schema";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { collectionsRouter } from "./collections";

function resultChain(rows: unknown[]) {
  return { from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(rows) })) })) };
}

describe("collections follow boundaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects collection creation for a non-admin caller", async () => {
    const caller = collectionsRouter.createCaller({ user: { id: 42, role: "user" } } as never);
    await expect(caller.adminCreate({ slug: "tested-collection", title: "Tested collection", description: "A sufficiently long test description.", published: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects cover uploads, library reads, deletion, and article replacement for a non-admin caller", async () => {
    const caller = collectionsRouter.createCaller({ user: { id: 42, role: "user" } } as never);
    await expect(caller.uploadCoverImage({ fileName: "cover.png", contentType: "image/png", dataBase64: "aGVsbG8=" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.coverLibrary()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.deleteCoverAsset({ id: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.adminReplaceArticles({ collectionId: 9, blogPostIds: [1] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("accepts managed cover metadata when an administrator creates a collection", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 14 }]);
    vi.mocked(getDb).mockResolvedValue({ insert: vi.fn(() => ({ values })) } as never);
    const caller = collectionsRouter.createCaller({ user: { id: 1, role: "admin" } } as never);
    await expect(caller.adminCreate({ slug: "cover-collection", title: "Cover collection", description: "A sufficiently long test description.", coverImage: "/manus-storage/cover.png", published: true })).resolves.toEqual({ id: 14 });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ coverImage: "/manus-storage/cover.png", published: 1 }));
  });

  it("persists category metadata when an administrator uploads a reusable cover", async () => {
    vi.mocked(storagePut).mockResolvedValue({ key: "collection-covers/cover.png", url: "/manus-storage/cover.png" });
    const values = vi.fn().mockResolvedValue([{ insertId: 17 }]);
    vi.mocked(getDb).mockResolvedValue({ insert: vi.fn(() => ({ values })) } as never);
    const caller = collectionsRouter.createCaller({ user: { id: 1, role: "admin" } } as never);
    await caller.uploadCoverImage({ fileName: "cover.png", contentType: "image/png", dataBase64: "aGVsbG8=", title: "Visit preparation", altText: "Notes and a compass", category: "appointments" });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ category: "appointments", imageUrl: "/manus-storage/cover.png" }));
  });

  it("rejects collection updates for a non-admin caller", async () => {
    const caller = collectionsRouter.createCaller({ user: { id: 42, role: "user" } } as never);
    await expect(caller.adminUpdate({ id: 9, slug: "tested-collection", title: "Tested collection", description: "A sufficiently long test description.", published: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("follows a published collection only for the authenticated user", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    const db = { select: vi.fn().mockReturnValueOnce(resultChain([{ id: 9 }])).mockReturnValueOnce(resultChain([])), insert: vi.fn(() => ({ values })) };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = collectionsRouter.createCaller({ user: { id: 42, role: "user" } } as never);
    await expect(caller.follow({ collectionId: 9 })).resolves.toEqual({ following: true, alreadyFollowing: false });
    expect(values).toHaveBeenCalledWith({ userId: 42, collectionId: 9 });
  });

  it("replaces membership in reading order and rejects unpublished article IDs", async () => {
    const collectionLimit = vi.fn().mockResolvedValue([{ id: 9 }]);
    const articleWhere = vi.fn().mockResolvedValue([{ id: 101 }, { id: 102 }]);
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockResolvedValue(undefined);
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: collectionLimit })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: articleWhere })) }),
      delete: vi.fn(() => ({ where: deleteWhere })),
      insert: vi.fn(() => ({ values })),
    };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = collectionsRouter.createCaller({ user: { id: 1, role: "admin" } } as never);

    await expect(caller.adminReplaceArticles({ collectionId: 9, blogPostIds: [101, 102] })).resolves.toEqual({ success: true, articleCount: 2 });
    expect(values).toHaveBeenCalledWith([
      { collectionId: 9, blogPostId: 101, sortOrder: 1 },
      { collectionId: 9, blogPostId: 102, sortOrder: 2 },
    ]);

    vi.mocked(getDb).mockResolvedValue({
      select: vi.fn()
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 9 }]) })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ id: 101 }]) })) }),
    } as never);
    await expect(caller.adminReplaceArticles({ collectionId: 9, blogPostIds: [101, 999] })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects deletion when a cover asset is still referenced", async () => {
    const assetWhere = vi.fn().mockResolvedValue([{ id: 7, imageUrl: "/manus-storage/cover.png" }]);
    const usageWhere = vi.fn().mockResolvedValue([{ usageCount: 1 }]);
    const db = { select: vi.fn().mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: assetWhere })) })) }).mockReturnValueOnce({ from: vi.fn(() => ({ where: usageWhere })) }) };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = collectionsRouter.createCaller({ user: { id: 1, role: "admin" } } as never);
    await expect(caller.deleteCoverAsset({ id: 7 })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("deletes an unused cover asset from the reusable library", async () => {
    const assetWhere = vi.fn().mockResolvedValue([{ id: 7, imageUrl: "/manus-storage/cover.png" }]);
    const usageWhere = vi.fn().mockResolvedValue([{ usageCount: 0 }]);
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const db = { select: vi.fn().mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: assetWhere })) })) }).mockReturnValueOnce({ from: vi.fn(() => ({ where: usageWhere })) }), delete: vi.fn(() => ({ where: deleteWhere })) };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = collectionsRouter.createCaller({ user: { id: 1, role: "admin" } } as never);
    await expect(caller.deleteCoverAsset({ id: 7 })).resolves.toEqual({ success: true });
    expect(deleteWhere).toHaveBeenCalled();
  });

  it("unfollows through a predicate that includes the authenticated user identifier", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const db = { delete: vi.fn(() => ({ where })) };
    vi.mocked(getDb).mockResolvedValue(db as never);
    const caller = collectionsRouter.createCaller({ user: { id: 42, role: "user" } } as never);
    await expect(caller.unfollow({ collectionId: 9 })).resolves.toEqual({ following: false });
    expect(eq).toHaveBeenCalledWith(userCollectionFollows.userId, 42);
  });
});
