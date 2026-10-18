/**
 * Creates a monthly recurring price in Stripe for The Patient's Compass Pro plan.
 * Run: node scripts/create-monthly-price.mjs
 */
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("ERROR: STRIPE_SECRET_KEY not set");
  process.exit(1);
}

const stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });

// First, check if a product already exists for the yearly plan
// so we can reuse the same product for the monthly price
const existingYearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID;
let productId;

if (existingYearlyPriceId) {
  console.log("Looking up existing yearly price:", existingYearlyPriceId);
  const yearlyPrice = await stripe.prices.retrieve(existingYearlyPriceId);
  productId = yearlyPrice.product;
  console.log("Found existing product:", productId);
} else {
  // Create a new product
  const product = await stripe.products.create({
    name: "The Patient's Compass Pro",
    description: "Full health intelligence system — AI Lab Analysis, Unlimited Medical Assistant, Biomarker Tracking, and more.",
  });
  productId = product.id;
  console.log("Created new product:", productId);
}

// Create the monthly price
const monthlyPrice = await stripe.prices.create({
  product: productId,
  unit_amount: 999, // $9.99 in cents
  currency: "usd",
  recurring: {
    interval: "month",
  },
  nickname: "Pro Monthly",
  metadata: {
    plan: "monthly",
    app: "patients-compass",
  },
});

console.log("\n✅ Monthly price created successfully!");
console.log("Price ID:", monthlyPrice.id);
console.log("Amount:", `$${(monthlyPrice.unit_amount / 100).toFixed(2)}/month`);
console.log("\nAdd this to your environment secrets:");
console.log(`STRIPE_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
