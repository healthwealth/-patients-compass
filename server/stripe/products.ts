/**
 * Stripe product and pricing definitions.
 * Monthly: $9.00/month
 * Yearly: $99.99/year (save $8.01 versus twelve monthly payments)
 */

export const STRIPE_PRODUCTS = {
  monthly: {
    name: "The Patient's Compass Pro — Monthly",
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID ?? "",
    amount: 900, // $9.00 in cents
    interval: "month" as const,
    label: "$9.00 / month",
  },
  yearly: {
    name: "The Patient's Compass Pro — Yearly",
    priceId: process.env.STRIPE_YEARLY_PRICE_ID ?? "",
    amount: 9999, // $99.99 in cents
    interval: "year" as const,
    label: "$99.99 / year",
  },
} as const;

export const FREE_FEATURES = [
  "Symptom Quiz & Biomarker Recommendations",
  "Interactive Biomarker Range Explorer",
  "Biomarker Directory (25+ markers)",
  "Basic Medical Assistant (3 queries/day)",
  "Sample Book Chapters",
  "FAQ & Help Center Access",
];

export const PRO_FEATURES = [
  "Everything in Free",
  "AI Lab Report Upload & Analysis",
  "Unlimited Medical Assistant (all 3 modes)",
  "Biomarker Trend Tracking & Charts",
  "AI Trend Intelligence Summaries",
  "Health Timeline & Notes",
  "Personalized Lifestyle AI Recommendations",
  "PDF Export (Doctor's Letter, Reports, Charts)",
  "Doctor's Letter Generator (AI-powered)",
  "Priority Email Support",
];
