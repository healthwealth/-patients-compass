import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createReferralCode,
  getUserReferralCode,
  trackReferral,
  getReferralEarnings,
  getReferralHistory,
  applyReferralCredits,
} from "../db.referrals";
import { TRPCError } from "@trpc/server";

export const referralRouter = router({
  /**
   * Get or create a referral code for the current user
   */
  getOrCreateCode: protectedProcedure.query(async ({ ctx }) => {
    try {
      let referral = await getUserReferralCode(ctx.user.id);

      if (!referral) {
        const result = await createReferralCode(ctx.user.id);
        return {
          code: result.code,
          expiresAt: result.expiresAt,
          referralUrl: `${process.env.VITE_APP_URL || process.env.APP_URL || "https://thepatientscompass.com"}?ref=${result.code}`,
        };
      }

      return {
        code: referral.referralCode,
        expiresAt: referral.expiresAt,
        referralUrl: `${process.env.VITE_APP_URL || process.env.APP_URL || "https://thepatientscompass.com"}?ref=${referral.referralCode}`,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get or create referral code",
      });
    }
  }),

  /**
   * Get referral earnings for the current user
   */
  getEarnings: protectedProcedure.query(async ({ ctx }) => {
    try {
      const earnings = await getReferralEarnings(ctx.user.id);
      return {
        totalEarned: earnings.totalEarned,
        creditsApplied: earnings.creditsApplied,
        pendingCredits: earnings.pendingCredits,
        referralCount: earnings.referralCount,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get referral earnings",
      });
    }
  }),

  /**
   * Get referral history for the current user
   */
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    try {
      const history = await getReferralHistory(ctx.user.id);
      return history.map((ref) => ({
        id: ref.id,
        code: ref.referralCode,
        status: ref.status,
        creditAmount: ref.creditAmount,
        creditApplied: ref.creditApplied === 1,
        referredUserEmail: ref.referredUserEmail || "Pending",
        createdAt: ref.createdAt,
        convertedAt: ref.convertedAt,
        expiresAt: ref.expiresAt,
      }));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get referral history",
      });
    }
  }),

  /**
   * Track a referral when a new user signs up
   * This is called from the signup flow with a referral code
   */
  trackSignup: protectedProcedure
    .input(z.object({ referralCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const referral = await trackReferral(input.referralCode, ctx.user.id);
        return {
          success: true,
          referrerId: referral.referrerId,
          creditAmount: referral.creditAmount,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired referral code",
        });
      }
    }),
});
