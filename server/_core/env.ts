function normalizeShopifyStorefrontToken(value: string) {
  if (/^[0-9a-fA-F]{32}$/.test(value)) return value;
  const candidates = value.match(/(?<![0-9a-fA-F])[0-9a-fA-F]{32}(?![0-9a-fA-F])/g) ?? [];
  return candidates.length === 1 ? candidates[0] : value;
}

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Prefer the explicitly configured test key in this independent copy; fall back
  // to the platform-managed Stripe key when no project test key is configured.
  stripeSecretKey: process.env.STRIPE_TEST_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY ?? "",
  // A project-scoped test secret enables signed local validation without
  // replacing the platform-managed webhook secret used by a deployed endpoint.
  stripeWebhookSecret: process.env.STRIPE_TEST_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET_THIN ?? process.env.STRIPE_WEBHOOK_SECRET ?? "",
  shopifyStoreDomain: process.env.SHOPIFY_STORE_DOMAIN ?? "",
  shopifyStorefrontAccessToken: normalizeShopifyStorefrontToken(process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? ""),
  shopifyApiVersion: process.env.SHOPIFY_API_VERSION ?? "2026-10",
  shopifyMonthlyVariantId: process.env.SHOPIFY_MONTHLY_VARIANT_ID ?? "",
  shopifyYearlyVariantId: process.env.SHOPIFY_YEARLY_VARIANT_ID ?? "",
  shopifyMonthlySellingPlanId: process.env.SHOPIFY_MONTHLY_SELLING_PLAN_ID ?? "",
  shopifyYearlySellingPlanId: process.env.SHOPIFY_YEARLY_SELLING_PLAN_ID ?? "",
  shopifyWebhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET ?? "",
  shopifyWebhookShopDomain: process.env.SHOPIFY_WEBHOOK_SHOP_DOMAIN ?? process.env.SHOPIFY_STORE_DOMAIN ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  plausibleDomain: process.env.VITE_PLAUSIBLE_DOMAIN ?? "",
  // OAuth credentials for social login
  googleClientId: process.env.VITE_GOOGLE_CLIENT_ID ?? "",
  appleServiceId: process.env.VITE_APPLE_SERVICE_ID ?? "",
  appleTeamId: process.env.VITE_APPLE_TEAM_ID ?? "",
  appleKeyId: process.env.VITE_APPLE_KEY_ID ?? "",
};
