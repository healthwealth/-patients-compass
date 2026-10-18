import Stripe from "stripe";
import { ENV } from "./env";

/**
 * Stripe Client - Singleton instance for payment processing
 * Handles all Stripe API interactions: customers, subscriptions, invoices, etc.
 */

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!ENV.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripeClient = new Stripe(ENV.stripeSecretKey);
  }
  return stripeClient;
}

/**
 * Create a Stripe customer for a user
 */
export async function createStripeCustomer(email: string, name: string) {
  const stripe = getStripeClient();
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      createdAt: new Date().toISOString(),
    },
  });
}

/**
 * Get or create Stripe customer
 */
export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  existingCustomerId?: string
) {
  const stripe = getStripeClient();

  if (existingCustomerId) {
    try {
      return await stripe.customers.retrieve(existingCustomerId);
    } catch (error) {
      console.error("Failed to retrieve Stripe customer:", error);
    }
  }

  // Search for existing customer by email
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  // Create new customer
  return await createStripeCustomer(email, name);
}

/**
 * Create checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  returnUrl: string,
  metadata?: Record<string, string>
) {
  const stripe = getStripeClient();

  return await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
    metadata,
  });
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  const stripe = getStripeClient();
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
) {
  const stripe = getStripeClient();

  if (immediately) {
    return await (stripe.subscriptions as any).del(subscriptionId);
  }

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate subscription (remove cancel_at_period_end)
 */
export async function reactivateSubscription(subscriptionId: string) {
  const stripe = getStripeClient();

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update subscription price (upgrade/downgrade)
 */
export async function updateSubscriptionPrice(
  subscriptionId: string,
  newPriceId: string,
  prorationBehavior: "create_prorations" | "none" = "create_prorations"
) {
  const stripe = getStripeClient();

  const subscription = await getSubscription(subscriptionId);
  const currentItem = subscription.items.data[0];

  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: currentItem.id,
        price: newPriceId,
      },
    ],
    proration_behavior: prorationBehavior,
  });
}

/**
 * Get billing history (invoices)
 */
export async function getBillingHistory(
  customerId: string,
  limit: number = 12
) {
  const stripe = getStripeClient();

  return await stripe.invoices.list({
    customer: customerId,
    limit,
    expand: ["data.payment_intent"],
  });
}

/**
 * Get invoice PDF
 */
export async function getInvoicePdf(invoiceId: string) {
  const stripe = getStripeClient();
  const invoice = await stripe.invoices.retrieve(invoiceId);
  return (invoice as any).pdf || invoice.hosted_invoice_url;
}

/**
 * Create payment method for customer
 */
export async function attachPaymentMethod(
  customerId: string,
  paymentMethodId: string
) {
  const stripe = getStripeClient();

  return await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
}

/**
 * Update customer default payment method
 */
export async function updateDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
) {
  const stripe = getStripeClient();

  return await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

/**
 * Get customer payment methods
 */
export async function getPaymentMethods(customerId: string) {
  const stripe = getStripeClient();

  return await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });
}

/**
 * Map Stripe subscription status to internal status
 */
export function mapSubscriptionStatus(
  stripeStatus: string
): "active" | "past_due" | "canceled" | "free" {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
      return "canceled";
    default:
      return "free";
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event {
  const stripe = getStripeClient();

  if (!ENV.stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set");
  }

  return stripe.webhooks.constructEvent(
    body,
    signature,
    ENV.stripeWebhookSecret
  );
}
