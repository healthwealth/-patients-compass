import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { z } from "zod";
import { blogPosts, userFavorites } from "../../drizzle/schema";
import { getDb, recordUserActivity } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const favoriteInput = z.object({ resourceType: z.literal("blog_post"), resourceId: z.number().int().positive() });
const listInput = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(24).default(12),
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(255).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).optional();

export const favoritesRouter = router({
  list: protectedProcedure.input(listInput).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const page = input?.page ?? 1;
    const pageSize = input?.pageSize ?? 12;
    const search = input?.search?.trim();
    const conditions = and(
      eq(userFavorites.userId, ctx.user.id),
      eq(userFavorites.resourceType, "blog_post"),
      eq(blogPosts.published, 1),
      input?.category ? eq(blogPosts.category, input.category) : undefined,
      search ? or(like(blogPosts.title, `%${search}%`), like(blogPosts.description, `%${search}%`), like(blogPosts.tags, `%${search}%`)) : undefined,
      input?.from ? gte(userFavorites.createdAt, new Date(`${input.from}T00:00:00.000Z`)) : undefined,
      input?.to ? lte(userFavorites.createdAt, new Date(`${input.to}T23:59:59.999Z`)) : undefined,
    );
    const [totalRow] = await db.select({ total: count() }).from(userFavorites).innerJoin(blogPosts, eq(userFavorites.resourceId, blogPosts.id)).where(conditions);
    const items = await db.select({
      id: userFavorites.id, resourceType: userFavorites.resourceType, resourceId: userFavorites.resourceId, createdAt: userFavorites.createdAt,
      title: blogPosts.title, slug: blogPosts.slug, description: blogPosts.description, featuredImage: blogPosts.featuredImage,
      category: blogPosts.category, tags: blogPosts.tags, readingTimeMinutes: blogPosts.readingTimeMinutes,
    }).from(userFavorites).innerJoin(blogPosts, eq(userFavorites.resourceId, blogPosts.id)).where(conditions)
      .orderBy(desc(userFavorites.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
    const total = Number(totalRow?.total ?? 0);
    return { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)), filters: { search: search ?? "", category: input?.category ?? "", from: input?.from ?? "", to: input?.to ?? "" } };
  }),

  contains: protectedProcedure.input(favoriteInput).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [favorite] = await db.select({ id: userFavorites.id }).from(userFavorites).where(and(eq(userFavorites.userId, ctx.user.id), eq(userFavorites.resourceType, input.resourceType), eq(userFavorites.resourceId, input.resourceId))).limit(1);
    return { saved: Boolean(favorite) };
  }),

  save: protectedProcedure.input(favoriteInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    const [post] = await db.select({ id: blogPosts.id }).from(blogPosts).where(and(eq(blogPosts.id, input.resourceId), eq(blogPosts.published, 1))).limit(1);
    if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "This article is unavailable to save." });
    const [existing] = await db.select({ id: userFavorites.id }).from(userFavorites).where(and(eq(userFavorites.userId, ctx.user.id), eq(userFavorites.resourceType, input.resourceType), eq(userFavorites.resourceId, input.resourceId))).limit(1);
    if (existing) return { favoriteId: existing.id, saved: true, alreadySaved: true };
    const [result] = await db.insert(userFavorites).values({ userId: ctx.user.id, ...input }).returning({ insertId: userFavorites.id });
    await recordUserActivity({ userId: ctx.user.id, eventType: "content_saved", title: "Article saved", summary: "A public article was added to your saved content.", sourceRef: String(input.resourceId) });
    return { favoriteId: Number((result as { insertId?: number }).insertId), saved: true, alreadySaved: false };
  }),

  remove: protectedProcedure.input(favoriteInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    await db.delete(userFavorites).where(and(eq(userFavorites.userId, ctx.user.id), eq(userFavorites.resourceType, input.resourceType), eq(userFavorites.resourceId, input.resourceId)));
    await recordUserActivity({ userId: ctx.user.id, eventType: "content_unsaved", title: "Article removed from saved content", summary: "A saved public article was removed.", sourceRef: String(input.resourceId) });
    return { saved: false };
  }),
});
