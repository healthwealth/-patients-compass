import { describe, expect, it } from "vitest";
import { ENV } from "../_core/env";
import { createShopifyCart } from "./storefront";

const FAMILY_VARIANT_ID = "gid://shopify/ProductVariant/50653193207973";

async function createCartForVariant(variantId: string) {
  const response = await fetch(`https://${ENV.shopifyStoreDomain}/api/${ENV.shopifyApiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": ENV.shopifyStorefrontAccessToken,
    },
    body: JSON.stringify({
      query: `mutation CartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart { id checkoutUrl }
          userErrors { field message }
        }
      }`,
      variables: { input: { lines: [{ merchandiseId: variantId, quantity: 1 }] } },
    }),
  });
  expect(response.ok).toBe(true);
  const payload = (await response.json()) as {
    data?: { cartCreate?: { cart?: { id?: string; checkoutUrl?: string }; userErrors?: Array<{ message: string }> } };
    errors?: Array<{ message?: string }>;
  };
  expect(payload.errors ?? []).toHaveLength(0);
  expect(payload.data?.cartCreate?.userErrors ?? []).toHaveLength(0);
  expect(payload.data?.cartCreate?.cart?.id).toMatch(/^gid:\/\/shopify\/Cart\//);
  expect(payload.data?.cartCreate?.cart?.checkoutUrl).toMatch(/^https:\/\//);
  return payload.data!.cartCreate!.cart!;
}

describe("Shopify live checkout carts", () => {
  it("creates non-payment carts for Monthly and Yearly through the application adapter", async () => {
    for (const plan of ["monthly", "yearly"] as const) {
      const cart = await createShopifyCart({ plan, origin: "runtime-test" });
      expect(cart.plan).toBe(plan);
      expect(cart.cartId).toMatch(/^gid:\/\/shopify\/Cart\//);
      expect(cart.checkoutUrl).toMatch(/^https:\/\//);
    }
  }, 30_000);

  it("creates a non-payment Family plan cart through Storefront API", async () => {
    const cart = await createCartForVariant(FAMILY_VARIANT_ID);
    expect(new URL(cart.checkoutUrl).hostname).toMatch(/\.myshopify\.com$/);
  }, 30_000);
});
