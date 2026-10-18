import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { buildApplicationConversionFunnel } from "../lib/conversionFunnel";
import { users, emailAutomation, userActivities } from "../../drizzle/schema";
import { eq, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminAnalyticsRouter = router({
  /** Application-state conversion funnel; returns aggregates only. */
  getConversionFunnel: adminProcedure
    .input(z.object({ days: z.number().int().min(7).max(365).default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });

      const start = new Date();
      start.setDate(start.getDate() - input.days);
      const cohort = await db.select({ id: users.id, trialStatus: users.trialStatus, subscriptionStatus: users.subscriptionStatus })
        .from(users).where(gte(users.createdAt, start));
      const activityRows = await db.select({ userId: userActivities.userId }).from(userActivities)
        .where(gte(userActivities.createdAt, start));
      return buildApplicationConversionFunnel(cohort, activityRows.map((row) => row.userId), input.days);
    }),
  /**
   * Get user growth metrics (daily signups over time)
   */
  getUserGrowth: adminProcedure
    .input(
      z.object({
        days: z.number().min(7).max(365).default(30),
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

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        const allUsers = await db
          .select({
            createdAt: users.createdAt,
          })
          .from(users)
          .where(gte(users.createdAt, startDate));

        // Group by day
        const byDay: Record<string, number> = {};
        for (const user of allUsers) {
          const day = user.createdAt.toISOString().split("T")[0];
          byDay[day] = (byDay[day] || 0) + 1;
        }

        const trend = Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({
            date,
            signups: count,
          }));

        const totalSignups = allUsers.length;
        const avgDaily = Math.round(totalSignups / input.days);

        return {
          totalSignups,
          avgDaily,
          trend,
          period: input.days,
        };
      } catch (error) {
        console.error("[AdminAnalytics] getUserGrowth failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get user growth metrics",
        });
      }
    }),

  /**
   * Get subscription metrics (active, free, churned)
   */
  getSubscriptionMetrics: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const allUsers = await db.select().from(users);

      const metrics = {
        total: allUsers.length,
        free: allUsers.filter((u) => u.subscriptionStatus === "free").length,
        active: allUsers.filter((u) => u.subscriptionStatus === "active").length,
        canceled: allUsers.filter((u) => u.subscriptionStatus === "canceled").length,
        pastDue: allUsers.filter((u) => u.subscriptionStatus === "past_due").length,
        inTrial: allUsers.filter((u) => u.isTrialActive === 1).length,
      };

      return {
        ...metrics,
        conversionRate: metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0,
        churnRate: metrics.active > 0 ? Math.round((metrics.canceled / metrics.active) * 100) : 0,
      };
    } catch (error) {
      console.error("[AdminAnalytics] getSubscriptionMetrics failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get subscription metrics",
      });
    }
  }),

  /**
   * Get user engagement metrics
   */
  getEngagementMetrics: adminProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const allUsers = await db.select().from(users);
      const allEmails = await db.select().from(emailAutomation);

      // Calculate engagement
      const emailsOpened = allEmails.filter((e) => e.trialExpirationEmailOpened === 1 || e.onboardingEmail1Opened === 1).length;
      const emailsClicked = allEmails.filter((e) => e.trialExpirationEmailOpened === 1).length;

      // Calculate retention (users active in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = allUsers.filter((u) => u.lastSignedIn >= sevenDaysAgo).length;

      return {
        totalUsers: allUsers.length,
        activeUsers,
        activeRate: allUsers.length > 0 ? Math.round((activeUsers / allUsers.length) * 100) : 0,
        emailsSent: allEmails.length,
        emailsOpened,
        emailOpenRate: allEmails.length > 0 ? Math.round((emailsOpened / allEmails.length) * 100) : 0,
        avgSessionsPerUser: allUsers.length > 0 ? (activeUsers / allUsers.length).toFixed(2) : "0",
      };
    } catch (error) {
      console.error("[AdminAnalytics] getEngagementMetrics failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get engagement metrics",
      });
    }
  }),

  /**
   * Get cohort retention analysis
   */
  getCohortRetention: adminProcedure
    .input(
      z.object({
        cohortSize: z.number().min(7).max(365).default(30),
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

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.cohortSize);

        const cohortUsers = await db
          .select()
          .from(users)
          .where(gte(users.createdAt, startDate));

        // Group by signup date
        const cohorts: Record<string, { total: number; retained: number }> = {};
        const now = new Date();

        for (const user of cohortUsers) {
          const cohortDate = user.createdAt.toISOString().split("T")[0];
          if (!cohorts[cohortDate]) {
            cohorts[cohortDate] = { total: 0, retained: 0 };
          }
          cohorts[cohortDate].total++;

          // Check if user was active in last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (user.lastSignedIn >= sevenDaysAgo) {
            cohorts[cohortDate].retained++;
          }
        }

        const cohortData = Object.entries(cohorts)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, data]) => ({
            cohortDate: date,
            cohortSize: data.total,
            retained: data.retained,
            retentionRate: data.total > 0 ? Math.round((data.retained / data.total) * 100) : 0,
          }));

        return {
          cohorts: cohortData,
          avgRetention:
            cohortData.length > 0
              ? Math.round(cohortData.reduce((sum, c) => sum + c.retentionRate, 0) / cohortData.length)
              : 0,
        };
      } catch (error) {
        console.error("[AdminAnalytics] getCohortRetention failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get cohort retention data",
        });
      }
    }),

  /**
   * Get export data (CSV format)
   */
  getExportData: adminProcedure
    .input(
      z.object({
        type: z.enum(["users", "emails", "subscriptions"]),
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

        let data: unknown[] = [];

        if (input.type === "users") {
          data = await db
            .select({
              id: users.id,
              email: users.email,
              name: users.name,
              subscriptionStatus: users.subscriptionStatus,
              createdAt: users.createdAt,
              lastSignedIn: users.lastSignedIn,
            })
            .from(users);
        } else if (input.type === "emails") {
          data = await db
            .select({
              userId: emailAutomation.userId,
              trialEmailSent: emailAutomation.trialExpirationEmailSent,
              onboardingEmailSent: emailAutomation.onboardingEmail1Sent,
              reEngagementEmailSent: emailAutomation.reEngagementEmailSent,
              weeklyDigestEmailSent: emailAutomation.weeklyDigestEmailSent,
            })
            .from(emailAutomation);
        } else if (input.type === "subscriptions") {
          data = await db
            .select({
              id: users.id,
              email: users.email,
              subscriptionStatus: users.subscriptionStatus,
              stripeCustomerId: users.stripeCustomerId,
              trialStatus: users.trialStatus,
              trialStartDate: users.trialStartDate,
              trialEndDate: users.trialEndDate,
            })
            .from(users)
            .where(eq(users.subscriptionStatus, "active"));
        }

        // Convert to CSV
        if (data.length === 0) {
          return { csv: "", filename: `${input.type}-export.csv` };
        }

        const headers = Object.keys(data[0] as Record<string, unknown>);
        const rows = data.map((row) =>
          headers
            .map((header) => {
              const value = (row as Record<string, unknown>)[header];
              if (value === null || value === undefined) return "";
              if (typeof value === "string" && value.includes(",")) {
                return `"${value}"`;
              }
              return String(value);
            })
            .join(",")
        );

        const csv = [headers.join(","), ...rows].join("\n");

        return {
          csv,
          filename: `${input.type}-export-${new Date().toISOString().split("T")[0]}.csv`,
        };
      } catch (error) {
        console.error("[AdminAnalytics] getExportData failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export data",
        });
      }
    }),
});
