import { describe, it, expect } from "vitest";
import Stripe from "stripe";

const hasConfiguredPrices = Boolean(
  (process.env.STRIPE_TEST_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY) &&
    process.env.STRIPE_MONTHLY_PRICE_ID &&
    process.env.STRIPE_YEARLY_PRICE_ID
);

describe("Stripe Configuration", () => {
  it.skipIf(!hasConfiguredPrices)("should have valid Stripe Price IDs configured", async () => {
    const stripeSecretKey = process.env.STRIPE_TEST_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY;
    const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID;
    const yearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID;

    // Check that all required env vars are set
    expect(stripeSecretKey).toBeDefined();
    expect(monthlyPriceId).toBeDefined();
    expect(yearlyPriceId).toBeDefined();

    // Verify price IDs follow Stripe format
    expect(monthlyPriceId).toMatch(/^price_/);
    expect(yearlyPriceId).toMatch(/^price_/);

    // Initialize Stripe and verify the prices exist
    const stripe = new Stripe(stripeSecretKey!, { apiVersion: "2026-04-22.dahlia" });

    // Fetch monthly price
    const monthlyPrice = await stripe.prices.retrieve(monthlyPriceId!);
    expect(monthlyPrice.id).toBe(monthlyPriceId);
    expect(monthlyPrice.recurring?.interval).toBe("month");
    expect(monthlyPrice.unit_amount).toBe(900); // $9.00 in cents

    // Fetch yearly price
    const yearlyPrice = await stripe.prices.retrieve(yearlyPriceId!);
    expect(yearlyPrice.id).toBe(yearlyPriceId);
    expect(yearlyPrice.recurring?.interval).toBe("year");
    expect(yearlyPrice.unit_amount).toBe(9999); // $99.99 in cents
  });
});
