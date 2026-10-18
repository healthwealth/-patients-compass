/**
 * Blog Router — tRPC procedures for blog post management
 * Handles CRUD operations and public blog queries
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { blogPosts } from "../../drizzle/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";

const COVER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024;

export const blogRouter = router({
  /** Upload a blog cover image to managed storage (admin only). */
  uploadCoverImage: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(180),
        contentType: z.enum(COVER_IMAGE_TYPES),
        dataBase64: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access is required to upload article images." });
      }

      if (!/^[A-Za-z0-9+/=]+$/.test(input.dataBase64)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image data is not valid base64." });
      }

      const bytes = Buffer.from(input.dataBase64, "base64");
      if (!bytes.length || bytes.length > MAX_COVER_IMAGE_BYTES) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Cover images must be 5 MB or smaller." });
      }

      const extensionByType: Record<(typeof COVER_IMAGE_TYPES)[number], string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
      };
      const safeStem = input.fileName
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "article-cover";
      const { url, key } = await storagePut(
        `blog-covers/${ctx.user.id}/${Date.now()}-${safeStem}.${extensionByType[input.contentType]}`,
        bytes,
        input.contentType
      );

      return { url, key };
    }),

  /**
   * Get all published blog posts with pagination and filtering
   * Public endpoint for blog listing page
   */
  listPublished: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(1).max(50).default(10),
        category: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, category, search } = input;
      const offset = (page - 1) * limit;
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Build query conditions
      const conditions = [eq(blogPosts.published, 1)];
      if (category) {
        conditions.push(eq(blogPosts.category, category));
      }

      // Get total count
      const total = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(blogPosts)
        .where(and(...conditions));

      // Get paginated posts
      let posts = await db
        .select()
        .from(blogPosts)
        .where(and(...conditions))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(limit)
        .offset(offset);

      return {
        posts,
        pagination: {
          page,
          limit,
          total: total[0]?.count || 0,
          pages: Math.ceil((total[0]?.count || 0) / limit),
        },
      };
    }),

  /**
   * Get a single blog post by slug
   * Public endpoint for individual article page
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const post = await db
        .select()
        .from(blogPosts)
        .where(and(eq(blogPosts.slug, input.slug), eq(blogPosts.published, 1)))
        .limit(1);

      if (!post.length) {
        throw new Error("Blog post not found");
      }

      // Increment view count
      await db
        .update(blogPosts)
        .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
        .where(eq(blogPosts.id, post[0].id));

      return post[0];
    }),

  /**
   * Get related blog posts based on category
   * Public endpoint for sidebar recommendations
   */
  getRelated: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        limit: z.number().int().min(1).max(10).default(3),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get the current post to find its category
      const currentPost = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, input.slug))
        .limit(1);

      if (!currentPost.length) {
        return [];
      }

      const { category } = currentPost[0];

      // Get related posts in the same category
      const related = await db
        .select()
        .from(blogPosts)
        .where(
          and(
            eq(blogPosts.category, category),
            eq(blogPosts.published, 1),
            sql`${blogPosts.slug} != ${input.slug}`
          )
        )
        .orderBy(desc(blogPosts.publishedAt))
        .limit(input.limit);

      return related;
    }),

  /**
   * Get blog categories for filtering
   * Public endpoint for blog navigation
   */
  getCategories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const categories = await db
      .selectDistinct({ category: blogPosts.category })
      .from(blogPosts)
      .where(eq(blogPosts.published, 1))
      .orderBy(blogPosts.category);

    return categories.map((c: any) => c.category);
  }),

  /**
   * Get popular blog posts by view count
   * Public endpoint for homepage or sidebar
   */
  getPopular: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(10).default(5) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        return await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.published, 1))
          .orderBy(desc(blogPosts.viewCount))
          .limit(input.limit);
      } catch {
        // A copied project can temporarily have its schema without blog data.
        // The homepage treats no popular articles as a valid empty state.
        console.warn("[Blog] Popular articles are temporarily unavailable; returning an empty list.");
        return [];
      }
    }),

  /**
   * Create a new blog post (admin only)
   */
  create: protectedProcedure
    .input(
      z.object({
        slug: z.string().regex(/^[a-z0-9-]+$/),
        title: z.string().min(5).max(255),
        description: z.string().min(10).max(160),
        content: z.string().min(100),
        featuredImage: z.string().url().optional(),
        author: z.string().optional(),
        keywords: z.string().optional(),
        category: z.string().default("health-education"),
        tags: z.string().optional(),
        readingTimeMinutes: z.number().int().min(1).max(60).default(5),
        published: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.insert(blogPosts).values({
        ...input,
        published: input.published ? 1 : 0,
        publishedAt: input.published ? new Date() : null,
      });

      return { slug: input.slug, success: true };
    }),

  /**
   * Update an existing blog post (admin only)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int(),
        slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
        title: z.string().min(5).max(255).optional(),
        description: z.string().min(10).max(160).optional(),
        content: z.string().min(100).optional(),
        featuredImage: z.string().url().optional(),
        author: z.string().optional(),
        keywords: z.string().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
        readingTimeMinutes: z.number().int().min(1).max(60).optional(),
        published: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { id, ...updateData } = input;

      // Handle published status change
      const updates: any = { ...updateData };
      if (updateData.published !== undefined) {
        updates.published = updateData.published ? 1 : 0;
        if (updateData.published) {
          updates.publishedAt = new Date();
        }
      }

      await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id));

      return { id, success: true };
    }),

  /**
   * Delete a blog post (admin only)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.delete(blogPosts).where(eq(blogPosts.id, input.id));

      return { success: true };
    }),

  /**
   * Get all blog posts (admin only) - for management dashboard
   */
  listAll: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access required");
      }

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { page, limit } = input;
      const offset = (page - 1) * limit;

      const total = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(blogPosts);

      const posts = await db
        .select()
        .from(blogPosts)
        .orderBy(desc(blogPosts.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        posts,
        pagination: {
          page,
          limit,
          total: total[0]?.count || 0,
          pages: Math.ceil((total[0]?.count || 0) / limit),
        },
      };
    }),
});
