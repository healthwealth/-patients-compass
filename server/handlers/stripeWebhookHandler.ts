import Stripe from "stripe";
import { Request, Response } from "express";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature, mapSubscriptionStatus } from "../_core/stripeClient";
import { sendEmail } from "../_core/emailService";

/**
 * Stripe Webhook Handler
 * Processes payment events from Stripe (checkout.session.completed, invoice.paid, subscription.updated, etc.)
 * Updates user subscription status in database
 */

export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      console.error("[Stripe Webhook] Missing signature header");
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(req.body, signature);
    } catch (error) {
      console.error("[Stripe Webhook] Signature verification failed:", error);
      return res.status(400).json({ error: "Invalid signature" });
    }

    // The managed Stripe integration sends verification events during setup.
    // Acknowledge these after signature validation without mutating application data.
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    const db = await getDb();
    if (!db) {
      console.error("[Stripe Webhook] Database connection failed");
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, db);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice, db);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, db);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, db);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, db);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Return 200 OK to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Unexpected error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle checkout.session.completed event
 * Triggered when user completes payment and subscription starts
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  db: any
) {
  try {
    if (!session.customer || !session.subscription) {
      console.warn("[Stripe Webhook] checkout.session.completed: Missing customer or subscription");
      return;
    }

    const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;

    // Find user by Stripe customer ID
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));

    if (!userRecords || userRecords.length === 0) {
      console.warn(`[Stripe Webhook] User not found for customer ${customerId}`);
      return;
    }

    const user = userRecords[0];

    // Update user subscription status
    await db
      .update(users)
      .set({
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`[Stripe Webhook] Updated user ${user.id} subscription to active`);

    // Send subscription confirmation email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Welcome to The Patient's Compass Pro! 🎉",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2C2A29;">Welcome to Pro! 🎉</h2>
            <p>Hi ${user.name || "there"},</p>
            <p>Your subscription is now active! You now have unlimited access to:</p>
            <ul style="color: #555;">
              <li>Unlimited AI health insights</li>
              <li>Advanced lab analysis</li>
              <li>Personalized wellness recommendations</li>
              <li>Priority email support</li>
            </ul>
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://thepatientscompass.com/dashboard" style="background-color: #6B8E6F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Go to Dashboard
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #EEE; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
            </p>
            <p style="color: #BBB; font-size: 11px; margin-top: 20px;">
              <a href="https://thepatientscompass.com/unsubscribe?email=${user.email}" style="color: #BBB; text-decoration: underline;">Unsubscribe</a> | 
              <a href="https://thepatientscompass.com/settings/email" style="color: #BBB; text-decoration: underline;">Email Preferences</a>
            </p>
          </div>
        `,
      }).catch((err) => {
        console.error(`[Stripe Webhook] Failed to send confirmation email to ${user.email}:`, err);
      });
    }
  } catch (error) {
    console.error("[Stripe Webhook] handleCheckoutSessionCompleted error:", error);
  }
}

/**
 * Handle invoice.paid event
 * Triggered when an invoice payment succeeds
 */
async function handleInvoicePaid(invoice: Stripe.Invoice, db: any) {
  try {
    if (!invoice.customer) {
      console.warn("[Stripe Webhook] invoice.paid: Missing customer");
      return;
    }

    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;
    const subscriptionId = (invoice as any).subscription ? (typeof (invoice as any).subscription === "string" ? (invoice as any).subscription : (invoice as any).subscription.id) : null;

    // Find user by Stripe customer ID
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));

    if (!userRecords || userRecords.length === 0) {
      console.warn(`[Stripe Webhook] User not found for customer ${customerId}`);
      return;
    }

    const user = userRecords[0];

    // Update subscription status to active (in case it was past_due)
    await db
      .update(users)
      .set({
        subscriptionStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`[Stripe Webhook] Invoice paid for user ${user.id}, subscription ${subscriptionId}`);

    // Send payment receipt email
    if (user.email) {
      const amount = invoice.amount_paid ? (invoice.amount_paid / 100).toFixed(2) : "0.00";
      const invoiceDate = new Date(invoice.created * 1000).toLocaleDateString();

      await sendEmail({
        to: user.email,
        subject: `Payment Receipt - $${amount}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2C2A29;">Payment Received ✓</h2>
            <p>Hi ${user.name || "there"},</p>
            <p>Thank you for your payment. Here's your receipt:</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <p><strong>Amount:</strong> $${amount}</p>
              <p><strong>Date:</strong> ${invoiceDate}</p>
              <p><strong>Invoice ID:</strong> ${invoice.number || invoice.id}</p>
            </div>
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://thepatientscompass.com/settings/billing" style="background-color: #6B8E6F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                View Billing History
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #EEE; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
            </p>
            <p style="color: #BBB; font-size: 11px; margin-top: 20px;">
              <a href="https://thepatientscompass.com/unsubscribe?email=${user.email}" style="color: #BBB; text-decoration: underline;">Unsubscribe</a> | 
              <a href="https://thepatientscompass.com/settings/email" style="color: #BBB; text-decoration: underline;">Email Preferences</a>
            </p>
          </div>
        `,
      }).catch((err) => {
        console.error(`[Stripe Webhook] Failed to send receipt email to ${user.email}:`, err);
      });
    }
  } catch (error) {
    console.error("[Stripe Webhook] handleInvoicePaid error:", error);
  }
}

/**
 * Handle invoice.payment_failed event
 * Triggered when an invoice payment fails
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, db: any) {
  try {
    if (!invoice.customer) {
      console.warn("[Stripe Webhook] invoice.payment_failed: Missing customer");
      return;
    }

    const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer.id;

    // Find user by Stripe customer ID
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));

    if (!userRecords || userRecords.length === 0) {
      console.warn(`[Stripe Webhook] User not found for customer ${customerId}`);
      return;
    }

    const user = userRecords[0];

    // Update subscription status to past_due
    await db
      .update(users)
      .set({
        subscriptionStatus: "past_due",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`[Stripe Webhook] Payment failed for user ${user.id}`);

    // Send payment failed email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Payment Failed - Action Required",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #D48C70;">Payment Failed ⚠️</h2>
            <p>Hi ${user.name || "there"},</p>
            <p>We weren't able to process your payment. Your subscription is temporarily suspended.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://thepatientscompass.com/settings/billing" style="background-color: #D48C70; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Update Payment Method
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              Please update your payment method to restore access to your Pro features.
            </p>
            <hr style="border: none; border-top: 1px solid #EEE; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
            </p>
            <p style="color: #BBB; font-size: 11px; margin-top: 20px;">
              <a href="https://thepatientscompass.com/unsubscribe?email=${user.email}" style="color: #BBB; text-decoration: underline;">Unsubscribe</a> | 
              <a href="https://thepatientscompass.com/settings/email" style="color: #BBB; text-decoration: underline;">Email Preferences</a>
            </p>
          </div>
        `,
      }).catch((err) => {
        console.error(`[Stripe Webhook] Failed to send payment failed email to ${user.email}:`, err);
      });
    }
  } catch (error) {
    console.error("[Stripe Webhook] handleInvoicePaymentFailed error:", error);
  }
}

/**
 * Handle customer.subscription.updated event
 * Triggered when subscription is updated (plan change, cancellation scheduled, etc.)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription, db: any) {
  try {
    if (!subscription.customer) {
      console.warn("[Stripe Webhook] subscription.updated: Missing customer");
      return;
    }

    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

    // Find user by Stripe customer ID
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));

    if (!userRecords || userRecords.length === 0) {
      console.warn(`[Stripe Webhook] User not found for customer ${customerId}`);
      return;
    }

    const user = userRecords[0];
    const newStatus = mapSubscriptionStatus(subscription.status);

    // Update subscription status
    await db
      .update(users)
      .set({
        subscriptionStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`[Stripe Webhook] Updated user ${user.id} subscription status to ${newStatus}`);

    // Send notification email if subscription is being canceled
    if ((subscription as any).cancel_at_period_end && user.email) {
      const cancelDate = new Date((subscription as any).current_period_end * 1000).toLocaleDateString();

      await sendEmail({
        to: user.email,
        subject: "Subscription Cancellation Scheduled",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2C2A29;">Subscription Cancellation Scheduled</h2>
            <p>Hi ${user.name || "there"},</p>
            <p>Your subscription will be canceled on <strong>${cancelDate}</strong>.</p>
            <p>You'll have access to Pro features until then. If you'd like to reactivate your subscription, you can do so anytime.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://thepatientscompass.com/settings/billing" style="background-color: #6B8E6F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                Manage Subscription
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #EEE; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
            </p>
            <p style="color: #BBB; font-size: 11px; margin-top: 20px;">
              <a href="https://thepatientscompass.com/unsubscribe?email=${user.email}" style="color: #BBB; text-decoration: underline;">Unsubscribe</a> | 
              <a href="https://thepatientscompass.com/settings/email" style="color: #BBB; text-decoration: underline;">Email Preferences</a>
            </p>
          </div>
        `,
      }).catch((err) => {
        console.error(`[Stripe Webhook] Failed to send cancellation email to ${user.email}:`, err);
      });
    }
  } catch (error) {
    console.error("[Stripe Webhook] handleSubscriptionUpdated error:", error);
  }
}

/**
 * Handle customer.subscription.deleted event
 * Triggered when subscription is deleted/canceled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription, db: any) {
  try {
    if (!subscription.customer) {
      console.warn("[Stripe Webhook] subscription.deleted: Missing customer");
      return;
    }

    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

    // Find user by Stripe customer ID
    const userRecords = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));

    if (!userRecords || userRecords.length === 0) {
      console.warn(`[Stripe Webhook] User not found for customer ${customerId}`);
      return;
    }

    const user = userRecords[0];

    // Update subscription status to canceled
    await db
      .update(users)
      .set({
        subscriptionStatus: "canceled",
        stripeSubscriptionId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`[Stripe Webhook] Canceled subscription for user ${user.id}`);

    // Send cancellation confirmation email
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Subscription Canceled",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2C2A29;">Subscription Canceled</h2>
            <p>Hi ${user.name || "there"},</p>
            <p>Your subscription has been canceled. You now have access to the Free plan only.</p>
            <p>We'd love to have you back! If you have any feedback or questions, please reach out to our support team.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="https://thepatientscompass.com/pricing" style="background-color: #6B8E6F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                View Plans
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #EEE; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
            </p>
            <p style="color: #BBB; font-size: 11px; margin-top: 20px;">
              <a href="https://thepatientscompass.com/unsubscribe?email=${user.email}" style="color: #BBB; text-decoration: underline;">Unsubscribe</a> | 
              <a href="https://thepatientscompass.com/settings/email" style="color: #BBB; text-decoration: underline;">Email Preferences</a>
            </p>
          </div>
        `,
      }).catch((err) => {
        console.error(`[Stripe Webhook] Failed to send cancellation email to ${user.email}:`, err);
      });
    }
  } catch (error) {
    console.error("[Stripe Webhook] handleSubscriptionDeleted error:", error);
  }
}
