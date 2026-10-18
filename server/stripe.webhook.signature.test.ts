import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "./_core/stripeClient";

describe("Stripe test webhook signing secret", () => {
  it("verifies a Stripe-compatible signed event", () => {
    const secret = process.env.STRIPE_TEST_WEBHOOK_SECRET;
    expect(secret).toBeTruthy();

    const payload = JSON.stringify({
      id: "evt_local_signature_test",
      object: "event",
      type: "payment_method.attached",
      data: { object: {} },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", secret!)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    const event = verifyWebhookSignature(payload, `t=${timestamp},v1=${signature}`);

    expect(event.id).toBe("evt_local_signature_test");
    expect(event.type).toBe("payment_method.attached");
  });
});
