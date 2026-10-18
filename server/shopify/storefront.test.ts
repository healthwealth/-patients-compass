import { afterEach, describe, expect, it, vi } from "vitest";
import { ENV } from "../_core/env";
import { createShopifyCart } from "./storefront";

const original = {
  domain: ENV.shopifyStoreDomain,
  token: ENV.shopifyStorefrontAccessToken,
  version: ENV.shopifyApiVersion,
  monthlyVariant: ENV.shopifyMonthlyVariantId,
  monthlyPlan: ENV.shopifyMonthlySellingPlanId,
};

afterEach(() => {
  ENV.shopifyStoreDomain = original.domain;
  ENV.shopifyStorefrontAccessToken = original.token;
  ENV.shopifyApiVersion = original.version;
  ENV.shopifyMonthlyVariantId = original.monthlyVariant;
  ENV.shopifyMonthlySellingPlanId = original.monthlyPlan;
  vi.restoreAllMocks();
});

describe("Shopify Storefront cart adapter", () => {
  it("creates a monthly cart with the selling plan and private account attributes", async () => {
    ENV.shopifyStoreDomain = "patients-compass.myshopify.com";
    ENV.shopifyStorefrontAccessToken = "storefront-token";
    ENV.shopifyApiVersion = "2026-01";
    ENV.shopifyMonthlyVariantId = "gid://shopify/ProductVariant/123";
    ENV.shopifyMonthlySellingPlanId = "gid://shopify/SellingPlan/456";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      data: { cartCreate: { cart: { id: "gid://shopify/Cart/1", checkoutUrl: "https://shopify.test/checkouts/1" }, userErrors: [] } },
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const result = await createShopifyCart({
      plan: "monthly",
      origin: "https://thepatientscompass.com",
      userId: 42,
      email: "member@example.com",
    });

    expect(result.checkoutUrl).toBe("https://shopify.test/checkouts/1");
    const request = fetchMock.mock.calls[0];
    expect(request[0]).toBe("https://patients-compass.myshopify.com/api/2026-01/graphql.json");
    const body = JSON.parse(String(request[1]?.body));
    expect(body.variables.input.lines[0]).toEqual({
      merchandiseId: "gid://shopify/ProductVariant/123",
      quantity: 1,
      sellingPlanId: "gid://shopify/SellingPlan/456",
    });
    expect(body.variables.input.buyerIdentity.email).toBe("member@example.com");
    expect(body.variables.input.attributes).toContainEqual({ key: "patients_compass_user_id", value: "42" });
  });

  it("fails closed when the store or storefront token is not configured", async () => {
    ENV.shopifyStoreDomain = "";
    ENV.shopifyStorefrontAccessToken = "";
    ENV.shopifyMonthlyVariantId = "gid://shopify/ProductVariant/123";
    await expect(createShopifyCart({ plan: "monthly", origin: "https://thepatientscompass.com" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});
