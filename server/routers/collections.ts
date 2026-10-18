import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { articleCollectionItems, articleCollections, blogPosts, collectionCoverAssets, userCollectionFollows } from "../../drizzle/schema";
import { getDb, recordUserActivity } from "../db";
import { storagePut } from "../storage";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

const collectionIdInput = z.object({ collectionId: z.number().int().positive() });
const coverImageInput = z.string().min(1).max(1024).refine((value) => value.startsWith("/manus-storage/") || /^https?:\/\//.test(value), "Cover image must use managed storage or HTTPS.");
const collectionFields = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(120),
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(500),
  coverImage: coverImageInput.nullable().optional(),
  published: z.boolean().default(true),
});
const articleIdsInput = z.object({ collectionId: z.number().int().positive(), blogPostIds: z.array(z.number().int().positive()).max(100) });
const imageTypes = ["image/jpeg", "image/png", "image/webp"] as const;

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

export const collectionsRouter = router({
  list: publicProcedure.query(async () => {
    const db = await requireDb();
    return db.select().from(articleCollections).where(eq(articleCollections.published, 1)).orderBy(desc(articleCollections.updatedAt));
  }),

  detail: publicProcedure.input(z.object({ slug: z.string().min(1).max(120) })).query(async ({ input }) => {
    const db = await requireDb();
    const [collection] = await db.select().from(articleCollections).where(and(eq(articleCollections.slug, input.slug), eq(articleCollections.published, 1))).limit(1);
    if (!collection) throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
    const articles = await db.select({ id: blogPosts.id, slug: blogPosts.slug, title: blogPosts.title, description: blogPosts.description, featuredImage: blogPosts.featuredImage, category: blogPosts.category, readingTimeMinutes: blogPosts.readingTimeMinutes })
      .from(articleCollectionItems).innerJoin(blogPosts, eq(articleCollectionItems.blogPostId, blogPosts.id))
      .where(and(eq(articleCollectionItems.collectionId, collection.id), eq(blogPosts.published, 1))).orderBy(asc(articleCollectionItems.sortOrder));
    return { collection, articles };
  }),

  followed: protectedProcedure.query(async ({ ctx }) => {
    const db = await requireDb();
    return db.select({ id: articleCollections.id, slug: articleCollections.slug, title: articleCollections.title, description: articleCollections.description, coverImage: articleCollections.coverImage, followedAt: userCollectionFollows.createdAt })
      .from(userCollectionFollows).innerJoin(articleCollections, eq(userCollectionFollows.collectionId, articleCollections.id))
      .where(and(eq(userCollectionFollows.userId, ctx.user.id), eq(articleCollections.published, 1))).orderBy(desc(userCollectionFollows.createdAt));
  }),

  isFollowing: protectedProcedure.input(collectionIdInput).query(async ({ ctx, input }) => {
    const db = await requireDb();
    const [follow] = await db.select({ id: userCollectionFollows.id }).from(userCollectionFollows).where(and(eq(userCollectionFollows.userId, ctx.user.id), eq(userCollectionFollows.collectionId, input.collectionId))).limit(1);
    return { following: Boolean(follow) };
  }),

  follow: protectedProcedure.input(collectionIdInput).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    const [collection] = await db.select({ id: articleCollections.id }).from(articleCollections).where(and(eq(articleCollections.id, input.collectionId), eq(articleCollections.published, 1))).limit(1);
    if (!collection) throw new TRPCError({ code: "NOT_FOUND", message: "Collection is unavailable" });
    const [existing] = await db.select({ id: userCollectionFollows.id }).from(userCollectionFollows).where(and(eq(userCollectionFollows.userId, ctx.user.id), eq(userCollectionFollows.collectionId, input.collectionId))).limit(1);
    if (existing) return { following: true, alreadyFollowing: true };
    await db.insert(userCollectionFollows).values({ userId: ctx.user.id, collectionId: input.collectionId });
    await recordUserActivity({ userId: ctx.user.id, eventType: "collection_followed", title: "Collection followed", summary: "A curated article collection was added to your library.", sourceRef: String(input.collectionId) });
    return { following: true, alreadyFollowing: false };
  }),

  unfollow: protectedProcedure.input(collectionIdInput).mutation(async ({ ctx, input }) => {
    const db = await requireDb();
    await db.delete(userCollectionFollows).where(and(eq(userCollectionFollows.userId, ctx.user.id), eq(userCollectionFollows.collectionId, input.collectionId)));
    await recordUserActivity({ userId: ctx.user.id, eventType: "collection_unfollowed", title: "Collection unfollowed", summary: "A curated article collection was removed from your library.", sourceRef: String(input.collectionId) });
    return { following: false };
  }),

  coverLibrary: adminProcedure.query(async () => {
    const db = await requireDb();
    const assets = await db.select().from(collectionCoverAssets).orderBy(desc(collectionCoverAssets.createdAt));
    if (!assets.length) return [];
    const usage = await db.select({ imageUrl: articleCollections.coverImage, usageCount: count() }).from(articleCollections).where(inArray(articleCollections.coverImage, assets.map((asset) => asset.imageUrl))).groupBy(articleCollections.coverImage);
    return assets.map((asset) => ({ ...asset, usageCount: Number(usage.find((row) => row.imageUrl === asset.imageUrl)?.usageCount ?? 0) }));
  }),

  deleteCoverAsset: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = await requireDb();
    const [asset] = await db.select().from(collectionCoverAssets).where(eq(collectionCoverAssets.id, input.id)).limit(1);
    if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "Cover asset not found" });
    const [usage] = await db.select({ usageCount: count() }).from(articleCollections).where(eq(articleCollections.coverImage, asset.imageUrl));
    if (Number(usage?.usageCount ?? 0) > 0) throw new TRPCError({ code: "CONFLICT", message: "This cover is still in use by a collection." });
    await db.delete(collectionCoverAssets).where(eq(collectionCoverAssets.id, input.id));
    return { success: true };
  }),

  uploadCoverImage: adminProcedure.input(z.object({ fileName: z.string().min(1).max(180), contentType: z.enum(imageTypes), dataBase64: z.string().min(1), title: z.string().min(3).max(160), altText: z.string().min(3).max(255), category: z.string().trim().min(2).max(80).default("general") })).mutation(async ({ ctx, input }) => {
    if (!/^[A-Za-z0-9+/=]+$/.test(input.dataBase64)) throw new TRPCError({ code: "BAD_REQUEST", message: "Image data is not valid base64." });
    const bytes = Buffer.from(input.dataBase64, "base64");
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Cover images must be 5 MB or smaller." });
    const extension = input.contentType === "image/jpeg" ? "jpg" : input.contentType.slice(6);
    const safeStem = input.fileName.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "collection-cover";
    const asset = await storagePut(`collection-covers/${ctx.user.id}/${Date.now()}-${safeStem}.${extension}`, bytes, input.contentType);
    const db = await requireDb();
    const [result] = await db.insert(collectionCoverAssets).values({ title: input.title, category: input.category, imageUrl: asset.url, altText: input.altText, createdBy: ctx.user.id });
    return { ...asset, assetId: Number((result as { insertId?: number }).insertId), title: input.title, altText: input.altText, category: input.category };
  }),

  adminList: adminProcedure.query(async () => {
    const db = await requireDb();
    const collections = await db.select().from(articleCollections).orderBy(desc(articleCollections.updatedAt));
    const counts = await db.select({ collectionId: articleCollectionItems.collectionId, count: count() }).from(articleCollectionItems).groupBy(articleCollectionItems.collectionId);
    return collections.map((collection) => ({ ...collection, articleCount: Number(counts.find((row) => row.collectionId === collection.id)?.count ?? 0) }));
  }),

  adminDetail: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const db = await requireDb();
    const [collection] = await db.select().from(articleCollections).where(eq(articleCollections.id, input.id)).limit(1);
    if (!collection) throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
    const articles = await db.select({ id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug, published: blogPosts.published, sortOrder: articleCollectionItems.sortOrder })
      .from(articleCollectionItems).innerJoin(blogPosts, eq(articleCollectionItems.blogPostId, blogPosts.id)).where(eq(articleCollectionItems.collectionId, input.id)).orderBy(asc(articleCollectionItems.sortOrder));
    return { collection, articles };
  }),

  adminListArticles: adminProcedure.query(async () => {
    const db = await requireDb();
    return db.select({ id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug, category: blogPosts.category, published: blogPosts.published }).from(blogPosts).orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt));
  }),

  adminCreate: adminProcedure.input(collectionFields).mutation(async ({ input }) => {
    const db = await requireDb();
    const [result] = await db.insert(articleCollections).values({ slug: input.slug, title: input.title, description: input.description, coverImage: input.coverImage ?? null, published: input.published ? 1 : 0 });
    return { id: Number((result as { insertId?: number }).insertId) };
  }),

  adminUpdate: adminProcedure.input(collectionFields.extend({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = await requireDb();
    const { id, ...fields } = input;
    await db.update(articleCollections).set({ ...fields, coverImage: fields.coverImage ?? null, published: fields.published ? 1 : 0 }).where(eq(articleCollections.id, id));
    return { id, success: true };
  }),

  adminDelete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
    const db = await requireDb();
    await db.delete(articleCollectionItems).where(eq(articleCollectionItems.collectionId, input.id));
    await db.delete(userCollectionFollows).where(eq(userCollectionFollows.collectionId, input.id));
    await db.delete(articleCollections).where(eq(articleCollections.id, input.id));
    return { success: true };
  }),

  adminReplaceArticles: adminProcedure.input(articleIdsInput).mutation(async ({ input }) => {
    const db = await requireDb();
    const [collection] = await db.select({ id: articleCollections.id }).from(articleCollections).where(eq(articleCollections.id, input.collectionId)).limit(1);
    if (!collection) throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
    const articles = input.blogPostIds.length ? await db.select({ id: blogPosts.id }).from(blogPosts).where(and(eq(blogPosts.published, 1), inArray(blogPosts.id, input.blogPostIds))) : [];
    if (articles.length !== input.blogPostIds.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Only published articles can be curated." });
    await db.delete(articleCollectionItems).where(eq(articleCollectionItems.collectionId, input.collectionId));
    if (input.blogPostIds.length) await db.insert(articleCollectionItems).values(input.blogPostIds.map((blogPostId, index) => ({ collectionId: input.collectionId, blogPostId, sortOrder: index + 1 })));
    return { success: true, articleCount: input.blogPostIds.length };
  }),
});
