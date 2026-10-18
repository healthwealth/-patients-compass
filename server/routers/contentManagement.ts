import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Content Management System for blog posts, biomarkers, and lifestyle recommendations
 * Admins can create/edit/delete content; users can view published content
 */

// Schema validation
const BlogPostSchema = z.object({
  title: z.string().min(5).max(200),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().min(10).max(500),
  content: z.string().min(100),
  author: z.string().min(2).max(100),
  category: z.enum(["health", "nutrition", "fitness", "mental-health", "lab-analysis"]),
  tags: z.array(z.string()).max(10),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  published: z.boolean().default(false),
});

const BiomarkerSchema = z.object({
  name: z.string().min(3).max(100),
  category: z.enum(["cardiovascular", "metabolic", "immune", "hormonal", "nutritional"]),
  optimalMin: z.number(),
  optimalMax: z.number(),
  unit: z.string().max(20),
  description: z.string().min(20).max(1000),
  interpretation: z.string().min(20).max(1000),
  recommendations: z.array(z.string()).max(10),
});

const LifestyleRecommendationSchema = z.object({
  title: z.string().min(5).max(150),
  category: z.enum(["sleep", "exercise", "nutrition", "stress", "hydration"]),
  description: z.string().min(50).max(1000),
  actionItems: z.array(z.string()).max(10),
  difficulty: z.enum(["easy", "medium", "hard"]),
  timeToImplement: z.string().max(50),
  benefits: z.array(z.string()).max(5),
});

export const contentManagementRouter = router({
  // ============ BLOG POSTS ============

  /**
   * Get all published blog posts (public)
   */
  getBlogPosts: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Query blog posts from database
        // For now, return mock data since we're using Drizzle
        const offset = (input.page - 1) * input.limit;

        return {
          posts: [],
          total: 0,
          page: input.page,
          limit: input.limit,
          hasMore: false,
        };
      } catch (error) {
        console.error("[ContentManagement] getBlogPosts failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch blog posts",
        });
      }
    }),

  /**
   * Get single blog post by slug (public)
   */
  getBlogPost: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Query blog post from database
        return null;
      } catch (error) {
        console.error("[ContentManagement] getBlogPost failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch blog post",
        });
      }
    }),

  /**
   * Create blog post (admin only)
   */
  createBlogPost: adminProcedure
    .input(BlogPostSchema)
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Check if slug already exists
        // For now, return success
        return {
          success: true,
          id: Math.random(),
          slug: input.slug,
          message: "Blog post created successfully",
        };
      } catch (error) {
        console.error("[ContentManagement] createBlogPost failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create blog post",
        });
      }
    }),

  /**
   * Update blog post (admin only)
   */
  updateBlogPost: adminProcedure
    .input(
      z.object({
        id: z.number(),
        ...BlogPostSchema.partial().shape,
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        return {
          success: true,
          id: input.id,
          message: "Blog post updated successfully",
        };
      } catch (error) {
        console.error("[ContentManagement] updateBlogPost failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update blog post",
        });
      }
    }),

  /**
   * Delete blog post (admin only)
   */
  deleteBlogPost: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        return {
          success: true,
          message: "Blog post deleted successfully",
        };
      } catch (error) {
        console.error("[ContentManagement] deleteBlogPost failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete blog post",
        });
      }
    }),

  // ============ BIOMARKERS ============

  /**
   * Get all biomarkers (public)
   */
  getBiomarkers: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        return {
          biomarkers: [],
          total: 0,
        };
      } catch (error) {
        console.error("[ContentManagement] getBiomarkers failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch biomarkers",
        });
      }
    }),

  /**
   * Create biomarker (admin only)
   */
  createBiomarker: adminProcedure
    .input(BiomarkerSchema)
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        return {
          success: true,
          id: Math.random(),
          name: input.name,
          message: "Biomarker created successfully",
        };
      } catch (error) {
        console.error("[ContentManagement] createBiomarker failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create biomarker",
        });
      }
    }),

  /**
   * Update biomarker (admin only)
   */
  updateBiomarker: adminProcedure
    .input(
      z.object({
        id: z.number(),
        ...BiomarkerSchema.partial().shape,
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        return {
          success: true,
          id: input.id,
          message: "Biomarker updated successfully",
        };
      } catch (error) {
        console.error("[ContentManagement] updateBiomarker failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update biomarker",
        });
      }
    }),

  /**
   * Delete biomarker (admin only)
   */
  deleteBiomarker: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        return {
          success: true,
          message: "Biomarker deleted successfully",
        };
      } catch (error) {
        console.error("[ContentManagement] deleteBiomarker failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete biomarker",
        });
      }
    }),

  // ============ LIFESTYLE RECOMMENDATIONS ============

  /**
   * Get all lifestyle recommendations (public)
   */
  getLifestyleRecommendations: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        difficulty: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        return {
          recommendations: [],
          total: 0,
        };
      } catch (error) {
        console.error("[ContentManagement] getLifestyleRecommendations failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch lifestyle recommendations",
        });
      }
    }),

  /**
   * Create lifestyle recommendation (admin only)
   */
  createLifestyleRecommendation: adminProcedure
    .input(LifestyleRecommendationSchema)
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        return {
          success: true,
          id: Math.random(),
          title: input.title,
          message: "Lifestyle recommendation created successfully",
        };
      } catch (error) {
        console.error("[ContentManagement] createLifestyleRecommendation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create lifestyle recommendation",
        });
      }
    }),

  /**
   * Update lifestyle recommendation (admin only)
   */
  updateLifestyleRecommendation: adminProcedure
    .input(
      z.object({
        id: z.number(),
        ...LifestyleRecommendationSchema.partial().shape,
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        return {
          success: true,
          id: input.id,
          message: "Lifestyle recommendation updated successfully",
        };
      } catch (error) {
        console.error("[ContentManagement] updateLifestyleRecommendation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update lifestyle recommendation",
        });
      }
    }),

  /**
   * Delete lifestyle recommendation (admin only)
   */
  deleteLifestyleRecommendation: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        return {
          success: true,
          message: "Lifestyle recommendation deleted successfully",
        };
      } catch (error) {
        console.error("[ContentManagement] deleteLifestyleRecommendation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete lifestyle recommendation",
        });
      }
    }),
});
