import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { emailAutomation, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * Email Preferences Router
 * Manages user email communication preferences and admin analytics
 */
export const emailPreferencesRouter = router({
  /**
   * Get current user's email preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const automation = await db
        .select({
          emailPreferences: emailAutomation.emailPreferences,
          createdAt: emailAutomation.createdAt,
          updatedAt: emailAutomation.updatedAt,
        })
        .from(emailAutomation)
        .where(eq(emailAutomation.userId, ctx.user.id))
        .then((rows) => rows[0]);

      if (!automation) {
        // Return defaults if no record exists yet
        return {
          marketing: true,
          transactional: true,
          digests: true,
          frequency: "weekly",
        };
      }

      const prefs = automation.emailPreferences || {
        marketing: true,
        transactional: true,
        digests: true,
        frequency: "weekly",
      };

      return prefs;
    } catch (error) {
      console.error("[EmailPreferences] Failed to get preferences:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get email preferences",
      });
    }
  }),

  /**
   * Update current user's email preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        marketing: z.boolean().optional(),
        transactional: z.boolean().optional(),
        digests: z.boolean().optional(),
        frequency: z.enum(["daily", "weekly", "never"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Get current preferences
        const current = await db
          .select({ emailPreferences: emailAutomation.emailPreferences })
          .from(emailAutomation)
          .where(eq(emailAutomation.userId, ctx.user.id))
          .then((rows) => rows[0]);

        const currentPrefs = current?.emailPreferences || {
          marketing: true,
          transactional: true,
          digests: true,
          frequency: "weekly",
        };

        // Merge with new preferences
        const updated = {
          ...currentPrefs,
          ...input,
        };

        // Update or insert
        if (current) {
          await db
            .update(emailAutomation)
            .set({
              emailPreferences: updated,
              updatedAt: new Date(),
            })
            .where(eq(emailAutomation.userId, ctx.user.id));
        } else {
          await db.insert(emailAutomation).values({
            userId: ctx.user.id,
            emailPreferences: updated,
          });
        }

        return {
          success: true,
          preferences: updated,
        };
      } catch (error) {
        console.error("[EmailPreferences] Failed to update preferences:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update email preferences",
        });
      }
    }),

  /**
   * Get email campaign analytics (admin only)
   */
  getCampaignMetrics: adminProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // Get all email automation records
      const records = await db
        .select({
          userId: emailAutomation.userId,
          trialExpirationEmailSent: emailAutomation.trialExpirationEmailSent,
          trialExpirationEmailOpened: emailAutomation.trialExpirationEmailOpened,
          trialExpirationEmailSentAt: emailAutomation.trialExpirationEmailSentAt,
          onboardingEmail1Sent: emailAutomation.onboardingEmail1Sent,
          onboardingEmail1Opened: emailAutomation.onboardingEmail1Opened,
          onboardingEmail1SentAt: emailAutomation.onboardingEmail1SentAt,
          onboardingEmail2Sent: emailAutomation.onboardingEmail2Sent,
          onboardingEmail2Opened: emailAutomation.onboardingEmail2Opened,
          onboardingEmail2SentAt: emailAutomation.onboardingEmail2SentAt,
          onboardingEmail3Sent: emailAutomation.onboardingEmail3Sent,
          onboardingEmail3Opened: emailAutomation.onboardingEmail3Opened,
          onboardingEmail3SentAt: emailAutomation.onboardingEmail3SentAt,
          reEngagementEmailSent: emailAutomation.reEngagementEmailSent,
          reEngagementEmailOpened: emailAutomation.reEngagementEmailOpened,
          reEngagementEmailSentAt: emailAutomation.reEngagementEmailSentAt,
          weeklyDigestEmailSent: emailAutomation.weeklyDigestEmailSent,
          weeklyDigestEmailOpened: emailAutomation.weeklyDigestEmailOpened,
          weeklyDigestEmailSentAt: emailAutomation.weeklyDigestEmailSentAt,
        })
        .from(emailAutomation);

      // Calculate metrics for each campaign
      const calculateMetrics = (sentField: number[], openedField: number[]) => {
        const sent = sentField.filter((v) => v === 1).length;
        const opened = openedField.filter((v) => v === 1).length;
        const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
        return { sent, opened, openRate };
      };

      const trialExpiration = calculateMetrics(
        records.map((r) => r.trialExpirationEmailSent),
        records.map((r) => r.trialExpirationEmailOpened)
      );

      const onboarding1 = calculateMetrics(
        records.map((r) => r.onboardingEmail1Sent),
        records.map((r) => r.onboardingEmail1Opened)
      );

      const onboarding2 = calculateMetrics(
        records.map((r) => r.onboardingEmail2Sent),
        records.map((r) => r.onboardingEmail2Opened)
      );

      const onboarding3 = calculateMetrics(
        records.map((r) => r.onboardingEmail3Sent),
        records.map((r) => r.onboardingEmail3Opened)
      );

      const reEngagement = calculateMetrics(
        records.map((r) => r.reEngagementEmailSent),
        records.map((r) => r.reEngagementEmailOpened)
      );

      const weeklyDigest = calculateMetrics(
        records.map((r) => r.weeklyDigestEmailSent),
        records.map((r) => r.weeklyDigestEmailOpened)
      );

      return {
        campaigns: {
          trialExpiration,
          onboarding: {
            email1: onboarding1,
            email2: onboarding2,
            email3: onboarding3,
            average: {
              sent: Math.round((onboarding1.sent + onboarding2.sent + onboarding3.sent) / 3),
              opened: Math.round((onboarding1.opened + onboarding2.opened + onboarding3.opened) / 3),
              openRate: Math.round((onboarding1.openRate + onboarding2.openRate + onboarding3.openRate) / 3),
            },
          },
          reEngagement,
          weeklyDigest,
        },
        totalUsers: records.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[EmailPreferences] Failed to get campaign metrics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get campaign metrics",
      });
    }
  }),

  /**
   * Get detailed campaign stats for a specific campaign (admin only)
   */
  getCampaignStats: adminProcedure
    .input(
      z.object({
        campaign: z.enum(["trialExpiration", "onboarding", "reEngagement", "weeklyDigest"]),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // Get all records and filter in memory
        const allRecords = await db.select().from(emailAutomation);

        // Map to campaign-specific fields
        const records = allRecords
          .map((record) => {
            if (input.campaign === "trialExpiration") {
              return {
                userId: record.userId,
                sentAt: record.trialExpirationEmailSentAt,
                sent: record.trialExpirationEmailSent,
                opened: record.trialExpirationEmailOpened,
              };
            } else if (input.campaign === "onboarding") {
              return {
                userId: record.userId,
                sentAt: record.onboardingEmail1SentAt,
                sent: record.onboardingEmail1Sent,
                opened: record.onboardingEmail1Opened,
              };
            } else if (input.campaign === "reEngagement") {
              return {
                userId: record.userId,
                sentAt: record.reEngagementEmailSentAt,
                sent: record.reEngagementEmailSent,
                opened: record.reEngagementEmailOpened,
              };
            } else {
              return {
                userId: record.userId,
                sentAt: record.weeklyDigestEmailSentAt,
                sent: record.weeklyDigestEmailSent,
                opened: record.weeklyDigestEmailOpened,
              };
            }
          })
          .filter((r) => r.sent === 1);

        // Group by day
        const byDay: Record<string, { sent: number; opened: number }> = {};
        for (const record of records) {
          if (!record.sentAt) continue;
          const day = record.sentAt.toISOString().split("T")[0];
          if (!byDay[day]) byDay[day] = { sent: 0, opened: 0 };
          byDay[day].sent++;
          if (record.opened === 1) byDay[day].opened++;
        }

        const trend = Object.entries(byDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, stats]) => ({
            date,
            sent: stats.sent,
            opened: stats.opened,
            openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0,
          }));

        return {
          campaign: input.campaign,
          totalSent: records.length,
          totalOpened: records.filter((r) => r.opened === 1).length,
          overallOpenRate: records.length > 0 ? Math.round((records.filter((r) => r.opened === 1).length / records.length) * 100) : 0,
          trend,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("[EmailPreferences] Failed to get campaign stats:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get campaign stats",
        });
      }
    }),
});
