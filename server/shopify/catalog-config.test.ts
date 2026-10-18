import { describe, expect, it } from "vitest";
import { ENV } from "../_core/env";

describe("Shopify catalog configuration", () => {
  it("resolves the configured Monthly and Yearly variants through Storefront API", async () => {
    expect(ENV.shopifyStorefrontAccessToken).toBeTruthy();
    expect(ENV.shopifyMonthlyVariantId).toMatch(/^gid:\/\/shopify\/ProductVariant\//);
    expect(ENV.shopifyYearlyVariantId).toMatch(/^gid:\/\/shopify\/ProductVariant\//);

    const response = await fetch(`https://${ENV.shopifyStoreDomain}/api/${ENV.shopifyApiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": ENV.shopifyStorefrontAccessToken,
      },
      body: JSON.stringify({
        query: `query CatalogConfig($ids: [ID!]!) {
          nodes(ids: $ids) {
            id
            ... on ProductVariant { product { title } }
          }
        }`,
        variables: {
          ids: [ENV.shopifyMonthlyVariantId, ENV.shopifyYearlyVariantId],
        },
      }),
    });

    expect(response.ok).toBe(true);
    const payload = (await response.json()) as {
      data?: { nodes?: Array<{ id: string; product?: { title?: string } }> };
      errors?: Array<{ message?: string }>;
    };
    expect(payload.errors ?? []).toHaveLength(0);
    expect(payload.data?.nodes).toHaveLength(2);
    expect(payload.data?.nodes?.map(node => node.product?.title)).toEqual([
      "The Patient's Compass Pro – Monthly",
      "The Patient's Compass Pro – Yearly",
    ]);
  });
});
