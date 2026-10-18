import type { Request, Response } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { ENV } from "../_core/env";

function getStripe(): Stripe {
  return new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-04-22.dahlia", httpClient: Stripe.createFetchHttpClient() });
}

/**
 * Maps a Stripe subscription status to our internal subscriptionStatus enum.
 */
function mapSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): "free" | "active" | "canceled" | "past_due" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "free";
  }
}

function getSubscriptionPlan(
  subscription: Stripe.Subscription
): "monthly" | "yearly" | null {
  const interval = subscription.items?.data[0]?.price.recurring?.interval;
  if (interval === "month") return "monthly";
  if (interval === "year") return "yearly";
  return null;
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  if (!ENV.stripeSecretKey || !ENV.stripeWebhookSecret) {
    console.error("[Webhook] Stripe not configured — missing secret key or webhook secret");
    return res.status(500).json({ error: "Stripe not configured" });
  }

  const stripe = getStripe();

  // Verify the event signature using the raw body
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(req.body, sig, ENV.stripeWebhookSecret);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  console.log(`[Webhook] Received: ${event.type} | id: ${event.id}`);

  // Test events from the Stripe dashboard must return verified:true to pass verification
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event — returning verification response");
    return res.json({ verified: true });
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Webhook] Database unavailable — acknowledging event without processing");
    return res.json({ received: true });
  }

  try {
    switch (event.type) {
      /**
       * Fired when a checkout session completes successfully.
       * Stores the Stripe customer ID and subscription ID on the user row.
       */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = parseInt(
          session.metadata?.user_id ?? session.client_reference_id ?? "0",
          10
        );

        if (!userId) {
          console.warn("[Webhook] checkout.session.completed — no user_id in metadata");
          break;
        }

        if (session.mode === "subscription") {
          const subscriptionPlan =
            session.metadata?.plan === "monthly" || session.metadata?.plan === "yearly"
              ? session.metadata.plan
              : undefined;
          await db
            .update(users)
            .set({
              stripeCustomerId: (session.customer as string) ?? undefined,
              stripeSubscriptionId: (session.subscription as string) ?? undefined,
              // Mark active immediately; invoice.paid will confirm it
              subscriptionStatus: "active",
              subscriptionPlan,
            })
            .where(eq(users.id, userId));
          console.log(
            `[Webhook] checkout.session.completed — user ${userId} subscription created: ${session.subscription}`
          );
        }
        break;
      }

      /**
       * Fired every time a subscription invoice is paid (initial + renewals).
       * Ensures the subscription stays active after each billing cycle.
       */
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        if (!customerId) break;

        await db
          .update(users)
          .set({ subscriptionStatus: "active" })
          .where(eq(users.stripeCustomerId, customerId));
        console.log(`[Webhook] invoice.paid — customer ${customerId} subscription confirmed active`);
        break;
      }

      /**
       * Fired when a subscription invoice payment fails.
       * Marks the subscription as past_due so the UI can prompt re-payment.
       */
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        if (!customerId) break;

        await db
          .update(users)
          .set({ subscriptionStatus: "past_due" })
          .where(eq(users.stripeCustomerId, customerId));
        console.log(
          `[Webhook] invoice.payment_failed — customer ${customerId} marked past_due`
        );
        break;
      }

      /**
       * Fired when a subscription is canceled (by user or due to non-payment).
       * Clears the subscription ID and sets status to canceled.
       */
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        if (!customerId) break;

        await db
          .update(users)
          .set({
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
            subscriptionPlan: null,
          })
          .where(eq(users.stripeCustomerId, customerId));
        console.log(
          `[Webhook] customer.subscription.deleted — customer ${customerId} subscription canceled`
        );
        break;
      }

      /**
       * Fired when a subscription changes (plan upgrade/downgrade, trial end, etc.).
       * Syncs the subscription status to the database.
       */
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        if (!customerId) break;

        const newStatus = mapSubscriptionStatus(subscription.status);
        const subscriptionPlan = getSubscriptionPlan(subscription);
        await db
          .update(users)
          .set({
            subscriptionStatus: newStatus,
            ...(subscriptionPlan ? { subscriptionPlan } : {}),
          })
          .where(eq(users.stripeCustomerId, customerId));
        console.log(
          `[Webhook] customer.subscription.updated — customer ${customerId} → ${newStatus} (stripe: ${subscription.status})`
        );
        break;
      }

      /**
       * Fired when a new customer is created in Stripe.
       * Stores the Stripe customer ID if it can be matched to a user by email.
       */
      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;
        if (!customer.email) break;

        // Only update if the user doesn't already have a customer ID
        const [existingUser] = await db
          .select({ id: users.id, stripeCustomerId: users.stripeCustomerId })
          .from(users)
          .where(eq(users.email, customer.email))
          .limit(1);

        if (existingUser && !existingUser.stripeCustomerId) {
          await db
            .update(users)
            .set({ stripeCustomerId: customer.id })
            .where(eq(users.id, existingUser.id));
          console.log(
            `[Webhook] customer.created — linked customer ${customer.id} to user ${existingUser.id}`
          );
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("[Webhook] Processing error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
