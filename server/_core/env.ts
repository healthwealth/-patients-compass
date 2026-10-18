function normalizeShopifyStorefrontToken(value: string) {
  if (/^[0-9a-fA-F]{32}$/.test(value)) return value;
  const candidates = value.match(/(?<![0-9a-fA-F])[0-9a-fA-F]{32}(?![0-9a-fA-F])/g) ?? [];
  return candidates.length === 1 ? candidates[0] : value;
}

const read = (name: string) => process.env[name] ?? "";

/**
 * Runtime configuration.
 *
 * On Cloudflare, Worker variables and secrets are exposed on `process.env`
 * (nodejs_compat). Values are read lazily through getters so they are always
 * taken from the live environment rather than captured at module load.
 */
const definitions = {
  /** Session-token audience. Any stable string works; kept for existing cookies. */
  get appId() { return read("APP_ID") || read("VITE_APP_ID") || "patients-compass"; },
  get cookieSecret() { return read("JWT_SECRET"); },
  /** Legacy Manus owner identifier; still promoted to admin if present. */
  get ownerOpenId() { return read("OWNER_OPEN_ID"); },
  /** Comma-separated list of emails that are always granted the admin role. */
  get adminEmails() {
    return read("ADMIN_EMAILS")
      .split(",")
      .map(value => value.trim().toLowerCase())
      .filter(Boolean);
  },
  /** Where owner notifications (new contact messages, escalations) are emailed. */
  get ownerEmail() { return read("OWNER_EMAIL") || this.adminEmails[0] || ""; },
  get isProduction() { return read("NODE_ENV") !== "development" && read("NODE_ENV") !== "test"; },
  /** Public origin of the site, e.g. https://thepatientscompass.com */
  get publicSiteUrl() { return (read("PUBLIC_SITE_URL") || "https://thepatientscompass.com").replace(/\/+$/, ""); },

  // ── AI (Anthropic Claude replaces the Manus built-in LLM) ──────────────────
  get anthropicApiKey() { return read("ANTHROPIC_API_KEY"); },
  get anthropicModel() { return read("ANTHROPIC_MODEL") || "claude-sonnet-5-5"; },
  /** Optional override (e.g. an AI Gateway URL). Defaults to the Anthropic API. */
  get anthropicBaseUrl() { return (read("ANTHROPIC_BASE_URL") || "https://api.anthropic.com").replace(/\/+$/, ""); },

  // ── Storage migration ──────────────────────────────────────────────────────
  /** Old Manus site used to copy media into R2 the first time each file is requested. */
  get legacyAssetOrigin() { return read("LEGACY_ASSET_ORIGIN").replace(/\/+$/, ""); },

  // ── Scheduled jobs ─────────────────────────────────────────────────────────
  get cronSecret() { return read("CRON_SECRET"); },

  // ── Stripe ─────────────────────────────────────────────────────────────────
  get stripeSecretKey() { return read("STRIPE_SECRET_KEY") || read("STRIPE_TEST_SECRET_KEY"); },
  get stripeWebhookSecret() { return read("STRIPE_WEBHOOK_SECRET") || read("STRIPE_TEST_WEBHOOK_SECRET") || read("STRIPE_WEBHOOK_SECRET_THIN"); },

  // ── Shopify ────────────────────────────────────────────────────────────────
  get shopifyStoreDomain() { return read("SHOPIFY_STORE_DOMAIN"); },
  get shopifyStorefrontAccessToken() { return normalizeShopifyStorefrontToken(read("SHOPIFY_STOREFRONT_ACCESS_TOKEN")); },
  get shopifyApiVersion() { return read("SHOPIFY_API_VERSION") || "2026-10"; },
  get shopifyMonthlyVariantId() { return read("SHOPIFY_MONTHLY_VARIANT_ID"); },
  get shopifyYearlyVariantId() { return read("SHOPIFY_YEARLY_VARIANT_ID"); },
  get shopifyMonthlySellingPlanId() { return read("SHOPIFY_MONTHLY_SELLING_PLAN_ID"); },
  get shopifyYearlySellingPlanId() { return read("SHOPIFY_YEARLY_SELLING_PLAN_ID"); },
  get shopifyWebhookSecret() { return read("SHOPIFY_WEBHOOK_SECRET"); },
  get shopifyWebhookShopDomain() { return read("SHOPIFY_WEBHOOK_SHOP_DOMAIN") || read("SHOPIFY_STORE_DOMAIN"); },

  // ── Email & analytics ──────────────────────────────────────────────────────
  get resendApiKey() { return read("RESEND_API_KEY"); },
  get plausibleDomain() { return read("VITE_PLAUSIBLE_DOMAIN"); },

  // ── Social login ───────────────────────────────────────────────────────────
  get googleClientId() { return read("GOOGLE_CLIENT_ID") || read("VITE_GOOGLE_CLIENT_ID"); },
  get appleServiceId() { return read("APPLE_SERVICE_ID") || read("VITE_APPLE_SERVICE_ID"); },
  get appleTeamId() { return read("APPLE_TEAM_ID") || read("VITE_APPLE_TEAM_ID"); },
  get appleKeyId() { return read("APPLE_KEY_ID") || read("VITE_APPLE_KEY_ID"); },
};

type Definitions = typeof definitions;
type EnvShape = { -readonly [K in keyof Definitions]: Definitions[K] };

/**
 * Live view of the settings. Each property reads `process.env` on access;
 * assigning a value (used by tests) overrides it until reset with `undefined`.
 */
export const ENV = (() => {
  const overrides = new Map<string, unknown>();
  const target = {} as EnvShape;
  for (const key of Object.keys(Object.getOwnPropertyDescriptors(definitions)) as Array<keyof Definitions>) {
    const descriptor = Object.getOwnPropertyDescriptor(definitions, key)!;
    Object.defineProperty(target, key, {
      enumerable: true,
      get() {
        return overrides.has(key) ? overrides.get(key) : descriptor.get!.call(target);
      },
      set(value: unknown) {
        if (value === undefined) overrides.delete(key);
        else overrides.set(key, value);
      },
    });
  }
  return target;
})();
