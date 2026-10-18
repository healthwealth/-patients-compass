import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { faqData, getAllFAQCategories, getFAQByCategory, searchFAQ, getCategoryDisplayName } from "../_core/faqData";

/**
 * FAQ Router
 * Serves FAQ data and search functionality
 */

export const faqRouter = router({
  /**
   * Get all FAQ items
   */
  getAll: publicProcedure.query(() => {
    return faqData;
  }),

  /**
   * Get FAQ items by category
   */
  getByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(({ input }) => {
      return getFAQByCategory(input.category as any);
    }),

  /**
   * Search FAQ items
   */
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(({ input }) => {
      return searchFAQ(input.query);
    }),

  /**
   * Get all categories
   */
  getCategories: publicProcedure.query(() => {
    return getAllFAQCategories();
  }),

  /**
   * Get category display name
   */
  getCategoryName: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(({ input }) => {
      return getCategoryDisplayName(input.category as any);
    }),

  /**
   * Mark FAQ item as helpful
   */
  markHelpful: publicProcedure
    .input(z.object({ faqId: z.string(), helpful: z.boolean() }))
    .mutation(({ input }) => {
      // In a real app, this would update a database
      // For now, we just return success
      return {
        success: true,
        message: `Thank you for your feedback on FAQ item ${input.faqId}`,
      };
    }),

  /**
   * Report FAQ item as unhelpful with reason
   */
  reportUnhelpful: publicProcedure
    .input(
      z.object({
        faqId: z.string(),
        reason: z.string().min(1).max(500),
        userEmail: z.string().email().optional(),
      })
    )
    .mutation(({ input }) => {
      // In a real app, this would log the feedback and notify support
      console.log("[FAQ] Unhelpful report:", input);
      return {
        success: true,
        message: "Thank you for your feedback. We will use this to improve our FAQ.",
      };
    }),
});
