import { TRPCError } from "@trpc/server";
import { ENV } from "../_core/env";

export type ShopifyPlan = "monthly" | "yearly";

type CartCreateResponse = {
  data?: {
    cartCreate?: {
      cart?: { id: string; checkoutUrl: string } | null;
      userErrors?: Array<{ field?: string[]; message: string }>;
    };
  };
  errors?: Array<{ message: string }>;
};

const CART_CREATE_MUTATION = `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

function required(value: string, label: string) {
  if (!value) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Shopify is not configured: ${label} is missing.`,
    });
  }
  return value;
}

function variantForPlan(plan: ShopifyPlan) {
  return plan === "yearly"
    ? {
        variantId: required(ENV.shopifyYearlyVariantId, "SHOPIFY_YEARLY_VARIANT_ID"),
        sellingPlanId: ENV.shopifyYearlySellingPlanId,
      }
    : {
        variantId: required(ENV.shopifyMonthlyVariantId, "SHOPIFY_MONTHLY_VARIANT_ID"),
        sellingPlanId: ENV.shopifyMonthlySellingPlanId,
      };
}

export async function createShopifyCart(input: {
  plan: ShopifyPlan;
  origin: string;
  userId?: number;
  email?: string | null;
}) {
  const storeDomain = required(ENV.shopifyStoreDomain, "SHOPIFY_STORE_DOMAIN");
  const token = required(ENV.shopifyStorefrontAccessToken, "SHOPIFY_STOREFRONT_ACCESS_TOKEN");
  const { variantId, sellingPlanId } = variantForPlan(input.plan);
  const attributes = [
    { key: "patients_compass_plan", value: input.plan },
    { key: "patients_compass_origin", value: input.origin },
    ...(input.userId ? [{ key: "patients_compass_user_id", value: String(input.userId) }] : []),
  ];

  const response = await fetch(`https://${storeDomain}/api/${ENV.shopifyApiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({
      query: CART_CREATE_MUTATION,
      variables: {
        input: {
          lines: [{
            merchandiseId: variantId,
            quantity: 1,
            ...(sellingPlanId ? { sellingPlanId } : {}),
          }],
          attributes,
          ...(input.email ? { buyerIdentity: { email: input.email } } : {}),
        },
      },
    }),
  });

  if (!response.ok) {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Shopify checkout is temporarily unavailable." });
  }

  const payload = (await response.json()) as CartCreateResponse;
  const errors = [
    ...(payload.errors ?? []).map(error => error.message),
    ...(payload.data?.cartCreate?.userErrors ?? []).map(error => error.message),
  ];
  const cart = payload.data?.cartCreate?.cart;
  if (errors.length || !cart?.checkoutUrl) {
    console.error("[Shopify] Cart creation failed:", errors);
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Shopify could not create the checkout cart." });
  }

  return { cartId: cart.id, checkoutUrl: cart.checkoutUrl, plan: input.plan };
}
