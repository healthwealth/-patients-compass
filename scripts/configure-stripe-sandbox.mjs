import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not configured");
}

const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });
const productName = "The Patient's Compass Pro";

const products = await stripe.products.list({ active: true, limit: 100 });
let product = products.data.find((candidate) => candidate.name === productName);

if (!product) {
  product = await stripe.products.create({
    name: productName,
    description: "Full access to The Patient's Compass health intelligence experience.",
    metadata: {
      application: "patients-compass",
      plan: "pro",
    },
  });
}

const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });

async function ensureRecurringPrice({ lookupKey, unitAmount, interval }) {
  const existing = prices.data.find(
    (price) =>
      price.lookup_key === lookupKey &&
      price.currency === "usd" &&
      price.unit_amount === unitAmount &&
      price.recurring?.interval === interval
  );

  if (existing) return existing;

  return stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: unitAmount,
    recurring: { interval },
    lookup_key: lookupKey,
    metadata: {
      application: "patients-compass",
      plan: "pro",
      cadence: interval,
    },
  });
}

const monthly = await ensureRecurringPrice({
  lookupKey: "patients_compass_pro_monthly",
  unitAmount: 900,
  interval: "month",
});

const yearly = await ensureRecurringPrice({
  lookupKey: "patients_compass_pro_yearly",
  unitAmount: 9999,
  interval: "year",
});

console.log(
  JSON.stringify(
    {
      productId: product.id,
      monthlyPriceId: monthly.id,
      yearlyPriceId: yearly.id,
    },
    null,
    2
  )
);
