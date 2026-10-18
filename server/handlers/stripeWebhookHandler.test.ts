import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { getDb } from "../db";
import { verifyWebhookSignature } from "../_core/stripeClient";
import { handleStripeWebhook } from "./stripeWebhookHandler";

vi.mock("../_core/stripeClient", () => ({
  verifyWebhookSignature: vi.fn(),
  mapSubscriptionStatus: vi.fn(),
}));

vi.mock("../_core/emailService", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("Stripe webhook verification events", () => {
  it("acknowledges a verified setup event without reading or mutating the database", async () => {
    vi.mocked(verifyWebhookSignature).mockReturnValue({
      id: "evt_test_webhook_verification",
      type: "payment_intent.succeeded",
    } as never);

    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const req = {
      headers: { "stripe-signature": "test-signature" },
      body: Buffer.from("{}"),
    } as unknown as Request;
    const res = { json, status } as unknown as Response;

    await handleStripeWebhook(req, res);

    expect(verifyWebhookSignature).toHaveBeenCalledWith(req.body, "test-signature");
    expect(json).toHaveBeenCalledWith({ verified: true });
    expect(getDb).not.toHaveBeenCalled();
  });
});
