import { z } from "zod";
import { eq, and, lt, gt } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

export const trialRouter = router({
  /** Start a 7-day free trial for the user */
  startTrial: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    // Check if user already has an active trial or subscription
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Don't allow trial if already subscribed or trial already active
    if (user.subscriptionStatus === "active" || user.trialStatus === "active") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User already has an active subscription or trial",
      });
    }

    // Calculate trial dates (7 days from now)
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Update user with trial info
    await db
      .update(users)
      .set({
        trialStartDate: now,
        trialEndDate,
        isTrialActive: 1,
        trialStatus: "active",
        subscriptionStatus: "active", // Treat trial as active subscription
      })
      .where(eq(users.id, ctx.user.id));

    return {
      success: true,
      trialStartDate: now,
      trialEndDate,
      daysRemaining: 7,
    };
  }),

  /** Get trial status for the current user */
  getTrialStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        isTrialActive: false,
        daysRemaining: 0,
        trialEndDate: null,
        trialStatus: "none",
      };
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user || !user.trialEndDate) {
      return {
        isTrialActive: false,
        daysRemaining: 0,
        trialEndDate: null,
        trialStatus: user?.trialStatus ?? "none",
      };
    }

    const now = new Date();
    const daysRemaining = Math.ceil(
      (user.trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    const isTrialActive = daysRemaining > 0 && user.trialStatus === "active";

    return {
      isTrialActive,
      daysRemaining: Math.max(0, daysRemaining),
      trialEndDate: user.trialEndDate,
      trialStatus: user.trialStatus,
    };
  }),

  /** Convert trial to paid subscription */
  convertTrialToPaid: protectedProcedure
    .input(
      z.object({
        stripeSubscriptionId: z.string(),
        stripeCustomerId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      await db
        .update(users)
        .set({
          trialStatus: "converted",
          isTrialActive: 0,
          stripeSubscriptionId: input.stripeSubscriptionId,
          stripeCustomerId: input.stripeCustomerId,
          subscriptionStatus: "active",
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: "Trial converted to paid subscription",
      };
    }),

  /** Mark trial as expired (no payment made) */
  expireTrial: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database connection failed",
      });
    }

    await db
      .update(users)
      .set({
        trialStatus: "expired",
        isTrialActive: 0,
        subscriptionStatus: "free",
      })
      .where(eq(users.id, ctx.user.id));

    return {
      success: true,
      message: "Trial expired",
    };
  }),

  /** Get all users with expired trials (for admin/cron jobs) */
  getExpiredTrials: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const now = new Date();
    const expiredUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.trialStatus, "active"),
          lt(users.trialEndDate, now)
        )
      );

    return expiredUsers;
  }),
});

export type TrialRouter = typeof trialRouter;
