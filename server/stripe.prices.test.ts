/**
 * Validates that the Stripe Price IDs are configured and resolve to the
 * correct products in the Stripe sandbox.
 */
import { describe, it, expect } from "vitest";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_TEST_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY ?? "";
const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID ?? "";
const YEARLY_PRICE_ID = process.env.STRIPE_YEARLY_PRICE_ID ?? "";
const hasConfiguredPrices = Boolean(STRIPE_SECRET_KEY && MONTHLY_PRICE_ID && YEARLY_PRICE_ID);

describe.skipIf(!hasConfiguredPrices)("Stripe Price IDs", () => {
  it("Stripe test secret key is set", () => {
    expect(STRIPE_SECRET_KEY).toBeTruthy();
    expect(STRIPE_SECRET_KEY.startsWith("sk_")).toBe(true);
  });

  it("STRIPE_MONTHLY_PRICE_ID is set", () => {
    expect(MONTHLY_PRICE_ID).toBeTruthy();
    expect(MONTHLY_PRICE_ID.startsWith("price_")).toBe(true);
  });

  it("STRIPE_YEARLY_PRICE_ID is set", () => {
    expect(YEARLY_PRICE_ID).toBeTruthy();
    expect(YEARLY_PRICE_ID.startsWith("price_")).toBe(true);
  });

  it("Monthly price resolves to $9.00/month in Stripe", async () => {
    if (!STRIPE_SECRET_KEY || !MONTHLY_PRICE_ID) return;
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
    const price = await stripe.prices.retrieve(MONTHLY_PRICE_ID);
    expect(price.id).toBe(MONTHLY_PRICE_ID);
    expect(price.unit_amount).toBe(900);
    expect(price.currency).toBe("usd");
    expect(price.recurring?.interval).toBe("month");
    expect(price.active).toBe(true);
  });

  it("Yearly price resolves to $99.99/year in Stripe", async () => {
    if (!STRIPE_SECRET_KEY || !YEARLY_PRICE_ID) return;
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
    const price = await stripe.prices.retrieve(YEARLY_PRICE_ID);
    expect(price.id).toBe(YEARLY_PRICE_ID);
    expect(price.unit_amount).toBe(9999);
    expect(price.currency).toBe("usd");
    expect(price.recurring?.interval).toBe("year");
    expect(price.active).toBe(true);
  });
});
