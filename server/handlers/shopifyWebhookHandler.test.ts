import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENV } from "../_core/env";
import { handleShopifyWebhook, inferPlan, inferStatus, verifyShopifySignature } from "./shopifyWebhookHandler";

const SECRET = "shopify-test-webhook-secret";

function sign(body: Buffer) {
  return crypto.createHmac("sha256", SECRET).update(body).digest("base64");
}

describe("Shopify webhook security helpers", () => {
  beforeEach(() => {
    ENV.shopifyWebhookSecret = SECRET;
    ENV.shopifyWebhookShopDomain = "patients-compass.myshopify.com";
  });

  it("verifies the HMAC over the exact raw request body", () => {
    const body = Buffer.from('{"id":123,"status":"active"}');
    expect(verifyShopifySignature(body, sign(body))).toBe(true);
    expect(verifyShopifySignature(body, sign(Buffer.from('{"id":123}')))).toBe(false);
    expect(verifyShopifySignature(body, "not-valid")).toBe(false);
  });

  it("infers the configured plan and lifecycle state without health data", () => {
    expect(inferPlan({ attributes: [{ key: "patients_compass_plan", value: "yearly" }] })).toBe("yearly");
    expect(inferPlan({ line_items: [{ title: "Patients Compass Pro Monthly" }] })).toBe("monthly");
    expect(inferStatus("subscription_contracts/cancel", {})).toBe("canceled");
    expect(inferStatus("subscription_contracts/failure", {})).toBe("past_due");
    expect(inferStatus("subscription_contracts/create", { status: "active" })).toBe("active");
  });
});

// Keep a small endpoint contract test separate from the pure helpers so signature
// failures are guaranteed to short-circuit before database access.
describe("Shopify webhook endpoint contract", () => {
  it("rejects a request with an invalid signature", async () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const req = {
      body: Buffer.from("{}"),
      headers: {
        "x-shopify-hmac-sha256": "invalid",
        "x-shopify-shop-domain": "patients-compass.myshopify.com",
        "x-shopify-topic": "orders/paid",
        "x-shopify-webhook-id": "evt-invalid",
      },
    } as any;
    await handleShopifyWebhook(req, { status, json } as any);
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: "Invalid signature" });
  });
});
