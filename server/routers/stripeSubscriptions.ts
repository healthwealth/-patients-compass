import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Stripe Subscription Management
 * Handles subscription tiers, upgrades, downgrades, and billing
 */

export const stripeSubscriptionsRouter = router({
  /**
   * Get current subscription status for user
   */
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      const userRecord = await db
        .select({
          subscriptionStatus: users.subscriptionStatus,
          stripeCustomerId: users.stripeCustomerId,
          stripeSubscriptionId: users.stripeSubscriptionId,
          trialStatus: users.trialStatus,
          trialStartDate: users.trialStartDate,
          trialEndDate: users.trialEndDate,
          isTrialActive: users.isTrialActive,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!userRecord || userRecord.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const user = userRecord[0];
      const now = new Date();
      const trialDaysRemaining = user.trialEndDate
        ? Math.ceil((user.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        status: user.subscriptionStatus,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        trialStatus: user.trialStatus,
        trialStartDate: user.trialStartDate,
        trialEndDate: user.trialEndDate,
        trialDaysRemaining: Math.max(0, trialDaysRemaining),
        isTrialActive: user.isTrialActive === 1,
      };
    } catch (error) {
      console.error("[StripeSubscriptions] getSubscriptionStatus failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get subscription status",
      });
    }
  }),

  /**
   * Get available subscription plans
   */
  getPlans: protectedProcedure.query(async () => {
    return {
      plans: [
        {
          id: "free",
          name: "Free",
          price: 0,
          billingPeriod: "month",
          features: [
            "Basic symptom quiz",
            "Lab result analysis",
            "Limited AI insights",
            "Email support",
          ],
          stripePriceId: null,
        },
        {
          id: "pro",
          name: "Pro",
          price: 29,
          billingPeriod: "month",
          features: [
            "Everything in Free",
            "Advanced lab analysis",
            "Unlimited AI insights",
            "Personalized wellness plans",
            "Priority support",
            "Monthly health reports",
          ],
          stripePriceId: process.env.STRIPE_PRICE_ID_PRO,
        },
        {
          id: "premium",
          name: "Premium",
          price: 99,
          billingPeriod: "month",
          features: [
            "Everything in Pro",
            "1-on-1 health coaching",
            "Advanced biomarker tracking",
            "Custom nutrition plans",
            "24/7 priority support",
            "Quarterly health reviews",
            "API access",
          ],
          stripePriceId: process.env.STRIPE_PRICE_ID_PREMIUM,
        },
      ],
    };
  }),

  /**
   * Create checkout session for subscription upgrade
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["pro", "premium"]),
        billingPeriod: z.enum(["month", "year"]).default("month"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        // TODO: Integrate with Stripe API to create checkout session
        // For now, return mock response
        return {
          success: true,
          checkoutUrl: `https://checkout.stripe.com/pay/cs_test_${Math.random().toString(36).substr(2, 9)}`,
          sessionId: `cs_test_${Math.random().toString(36).substr(2, 9)}`,
        };
      } catch (error) {
        console.error("[StripeSubscriptions] createCheckoutSession failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  /**
   * Get billing history and invoices
   */
  getBillingHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        // TODO: Fetch invoices from Stripe API
        // For now, return empty list
        return {
          invoices: [],
          total: 0,
        };
      } catch (error) {
        console.error("[StripeSubscriptions] getBillingHistory failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get billing history",
        });
      }
    }),

  /**
   * Update payment method
   */
  updatePaymentMethod: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        // TODO: Update payment method in Stripe
        return {
          success: true,
          message: "Payment method updated successfully",
        };
      } catch (error) {
        console.error("[StripeSubscriptions] updatePaymentMethod failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update payment method",
        });
      }
    }),

  /**
   * Cancel subscription
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed",
        });
      }

      // TODO: Cancel subscription in Stripe
      // Update user record
      await db
        .update(users)
        .set({
          subscriptionStatus: "canceled",
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: "Subscription canceled successfully",
        effectiveDate: new Date(),
      };
    } catch (error) {
      console.error("[StripeSubscriptions] cancelSubscription failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }
  }),

  /**
   * Reactivate canceled subscription
   */
  reactivateSubscription: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["pro", "premium"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database connection failed",
          });
        }

        // TODO: Reactivate subscription in Stripe
        // Update user record
        await db
          .update(users)
          .set({
            subscriptionStatus: "active",
            updatedAt: new Date(),
          })
          .where(eq(users.id, ctx.user.id));

        return {
          success: true,
          message: "Subscription reactivated successfully",
          planId: input.planId,
        };
      } catch (error) {
        console.error("[StripeSubscriptions] reactivateSubscription failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reactivate subscription",
        });
      }
    }),

  /**
   * Get subscription analytics (admin only)
   */
  getSubscriptionAnalytics: adminProcedure
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

        // TODO: Calculate subscription metrics
        return {
          mrr: 0, // Monthly Recurring Revenue
          arr: 0, // Annual Recurring Revenue
          activeSubscriptions: 0,
          churnRate: 0,
          newSubscriptions: 0,
          canceledSubscriptions: 0,
          avgSubscriptionValue: 0,
          trend: [],
        };
      } catch (error) {
        console.error("[StripeSubscriptions] getSubscriptionAnalytics failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get subscription analytics",
        });
      }
    }),
});
