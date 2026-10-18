/**
 * Test webhook script - Simulates a Stripe webhook event
 * This verifies that the webhook handler correctly processes events
 */

import { createHmac } from "crypto";

const WEBHOOK_URL = "http://localhost:3000/api/stripe/webhook";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test";

// Sample checkout.session.completed event
const testEvent = {
  id: "evt_test_webhook_123",
  type: "checkout.session.completed",
  object: "event",
  data: {
    object: {
      id: "cs_test_123",
      object: "checkout.session",
      mode: "subscription",
      customer: "cus_test_abc",
      subscription: "sub_test_xyz",
      client_reference_id: "42",
      metadata: { user_id: "42" },
    },
  },
  livemode: false,
  created: Math.floor(Date.now() / 1000),
  api_version: "2026-04-22.dahlia",
  pending_webhooks: 1,
  request: null,
};

function generateSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedContent = `${timestamp}.${payload}`;
  const signature = createHmac("sha256", secret)
    .update(signedContent)
    .digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

async function testWebhook() {
  try {
    console.log("🧪 Testing Stripe webhook...\n");

    const body = JSON.stringify(testEvent);
    const signature = generateSignature(body, WEBHOOK_SECRET);

    console.log("📤 Sending webhook event to:", WEBHOOK_URL);
    console.log("📋 Event type:", testEvent.type);
    console.log("👤 Customer ID:", testEvent.data.object.customer);
    console.log("💳 Subscription ID:", testEvent.data.object.subscription);

    // Send the webhook
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: Buffer.from(body),
    });

    const result = await response.json();

    console.log("\n✅ Response status:", response.status);
    console.log("📝 Response:", JSON.stringify(result, null, 2));

    if (response.status === 200) {
      console.log("\n🎉 Webhook processed successfully!");
      console.log("✓ Webhook handler received the event");
      console.log("✓ Signature verification passed");
      console.log("✓ Database update should have been triggered");
    } else {
      console.log("\n❌ Webhook processing failed!");
    }
  } catch (error) {
    console.error("\n❌ Error testing webhook:", error.message);
    process.exit(1);
  }
}

testWebhook();
