import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { ENV } from "../_core/env";
import { verifyShopifySignature } from "../handlers/shopifyWebhookHandler";

describe("Shopify runtime configuration", () => {
  it("authenticates the Storefront API and verifies the configured webhook secret", async () => {
    expect(ENV.shopifyStoreDomain).toBe("s064cx-hu.myshopify.com");
    expect(ENV.shopifyStorefrontAccessToken).toBeTruthy();
    expect(ENV.shopifyWebhookSecret).toBeTruthy();

    const response = await fetch(`https://${ENV.shopifyStoreDomain}/api/${ENV.shopifyApiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-shopify-storefront-access-token": ENV.shopifyStorefrontAccessToken,
      },
      body: JSON.stringify({ query: "query { shop { name } }" }),
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.ok).toBe(true);
    const payload = (await response.json()) as {
      data?: { shop?: { name?: string } };
      errors?: Array<{ message?: string }>;
    };
    expect(payload.errors ?? []).toHaveLength(0);
    expect(payload.data?.shop?.name).toBeTruthy();

    const body = Buffer.from(JSON.stringify({ topic: "orders/paid", id: "runtime-config-check" }));
    const signature = crypto.createHmac("sha256", ENV.shopifyWebhookSecret).update(body).digest("base64");
    expect(verifyShopifySignature(body, signature)).toBe(true);
  });
});
