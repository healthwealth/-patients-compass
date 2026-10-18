import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAnalyticsForDateRange,
  getLatestSnapshot,
  getConversionMetrics,
  getRevenueMetrics,
  getUserGrowthMetrics,
} from "../db.analytics";

/**
 * Admin-only analytics router
 * All procedures check for admin role
 */
export const analyticsRouter = router({
  /**
   * Get latest analytics snapshot
   */
  getLatestSnapshot: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    try {
      const snapshot = await getLatestSnapshot();
      return snapshot;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get analytics snapshot",
      });
    }
  }),

  /**
   * Get analytics for a date range
   */
  getDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        const snapshots = await getAnalyticsForDateRange(
          input.startDate,
          input.endDate
        );
        return snapshots;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get analytics data",
        });
      }
    }),

  /**
   * Get conversion metrics
   */
  getConversionMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    try {
      const metrics = await getConversionMetrics();
      return metrics;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get conversion metrics",
      });
    }
  }),

  /**
   * Get revenue metrics
   */
  getRevenueMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    try {
      const metrics = await getRevenueMetrics();
      return metrics;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get revenue metrics",
      });
    }
  }),

  /**
   * Get user growth metrics
   */
  getUserGrowthMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    try {
      const metrics = await getUserGrowthMetrics();
      return metrics;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get user growth metrics",
      });
    }
  }),

  /**
   * Get all metrics dashboard
   */
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    try {
      const [
        latestSnapshot,
        conversionMetrics,
        revenueMetrics,
        userGrowthMetrics,
      ] = await Promise.all([
        getLatestSnapshot(),
        getConversionMetrics(),
        getRevenueMetrics(),
        getUserGrowthMetrics(),
      ]);

      return {
        latestSnapshot,
        conversionMetrics,
        revenueMetrics,
        userGrowthMetrics,
        lastUpdated: new Date(),
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get dashboard data",
      });
    }
  }),
});
