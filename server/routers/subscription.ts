import Stripe from "stripe";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { recordUserActivity } from "../db";
import { users } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

function getStripe() {
  if (!ENV.stripeSecretKey) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
  }
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-04-22.dahlia" });
}

export const subscriptionRouter = router({
  /** Get current user's subscription status */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { status: "free", plan: null, isPro: false, stripeCustomerId: null, stripeSubscriptionId: null, shopifyCustomerId: null, shopifySubscriptionContractId: null };
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    return {
      status: user?.subscriptionStatus ?? "free",
      plan: user?.subscriptionPlan ?? null,
      isPro: user?.subscriptionStatus === "active",
      stripeCustomerId: user?.stripeCustomerId ?? null,
      stripeSubscriptionId: user?.stripeSubscriptionId ?? null,
      shopifyCustomerId: user?.shopifyCustomerId ?? null,
      shopifySubscriptionContractId: user?.shopifySubscriptionContractId ?? null,
    };
  }),

  /** Create a Stripe Checkout Session for monthly or yearly plan */
  createCheckout: protectedProcedure
    .input(z.object({
      plan: z.enum(["monthly", "yearly"]),
      origin: z.string().url(),
      guestEmail: z.string().email().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const db = await getDb();

      // Get or create Stripe customer
      let customerId: string | undefined;
      if (db) {
        const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        if (user?.stripeCustomerId) {
          customerId = user.stripeCustomerId;
        } else {
          const customer = await stripe.customers.create({
            email: ctx.user.email ?? undefined,
            name: ctx.user.name ?? undefined,
            metadata: { userId: ctx.user.id.toString() },
          });
          customerId = customer.id;
          await db.update(users)
            .set({ stripeCustomerId: customerId })
            .where(eq(users.id, ctx.user.id));
        }
      }

      const isYearly = input.plan === "yearly";
      const priceId = isYearly
        ? (process.env.STRIPE_YEARLY_PRICE_ID ?? "")
        : (process.env.STRIPE_MONTHLY_PRICE_ID ?? "");

      if (!priceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Stripe price ID not configured for plan: ${input.plan}`,
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: `${input.origin}/purchase-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/pricing?canceled=1`,
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
          plan: input.plan,
        },
      });
      return { url: session.url };
    }),

  /** Create a Stripe Customer Portal session for managing subscription */
  createPortal: protectedProcedure
    .input(z.object({ origin: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user?.stripeCustomerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription found" });
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${input.origin}/pricing`,
      });
      await recordUserActivity({
        userId: ctx.user.id,
        eventType: "subscription_portal_opened",
        title: "Subscription settings opened",
        summary: "Subscription management was opened securely in Stripe.",
      });
      return { url: session.url };
    }),
});

/** Public checkout — works without login, Stripe collects email */
export const publicCheckoutRouter = router({
  createGuestCheckout: publicProcedure
    .input(z.object({
      plan: z.enum(["monthly", "yearly"]),
      origin: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const stripe = getStripe();

      const isYearly = input.plan === "yearly";
      const priceId = isYearly
        ? (process.env.STRIPE_YEARLY_PRICE_ID ?? "")
        : (process.env.STRIPE_MONTHLY_PRICE_ID ?? "");

      if (!priceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Stripe price ID not configured for plan: ${input.plan}`,
        });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${input.origin}/purchase-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/pricing?canceled=1`,
        allow_promotion_codes: true,
        // In subscription mode Stripe always creates a customer automatically
        metadata: { plan: input.plan },
      });
      return { url: session.url };
    }),
});

/** Public subscription status for non-authenticated pages */
export const publicSubscriptionRouter = router({
  plans: publicProcedure.query(() => ({
    monthly: { amount: 900, label: "$9.00 / month", interval: "month" },
    yearly: { amount: 9999, label: "$99.99 / year", interval: "year" },
  })),

  /** Look up a Stripe checkout session by ID — safe for public/guest buyers */
  getSessionPlan: publicProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .query(async ({ input }) => {
      const stripe = getStripe();
      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
          expand: ["line_items.data.price"],
        });
        const price = session.line_items?.data[0]?.price as Stripe.Price | undefined;
        const interval = price?.recurring?.interval;
        const planLabel =
          interval === "year" ? "Pro Annual" :
          interval === "month" ? "Pro Monthly" :
          "Pro";
        return { planLabel, paymentStatus: session.payment_status };
      } catch {
        return { planLabel: "Pro", paymentStatus: "unknown" };
      }
    }),
});
