/**
 * Tests for the Stripe webhook handler at /api/stripe/webhook.
 *
 * Strategy: use Stripe's own stripe.webhooks.generateTestHeaderString() to
 * produce valid signatures, then verify the handler responds correctly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import Stripe from "stripe";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockWhere = vi.fn().mockResolvedValue([]);
const mockSet = vi.fn().mockImplementation(() => ({ where: mockWhere }));
const mockUpdate = vi.fn().mockImplementation(() => ({ set: mockSet }));
const mockLimit = vi.fn().mockResolvedValue([]);
const mockWhere2 = vi.fn().mockImplementation(() => ({ limit: mockLimit }));
const mockFrom = vi.fn().mockImplementation(() => ({ where: mockWhere2 }));
const mockSelect = vi.fn().mockImplementation(() => ({ from: mockFrom }));

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    update: mockUpdate,
    select: mockSelect,
  }),
}));

// ── Constants ─────────────────────────────────────────────────────────────────

// Use a raw secret (not base64-encoded) so Stripe's generateTestHeaderString works
const WEBHOOK_SECRET = "whsec_testsecretforvitest1234567890";
const STRIPE_SECRET = "sk_test_vitest_placeholder";

process.env.STRIPE_SECRET_KEY = STRIPE_SECRET;
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.STRIPE_TEST_WEBHOOK_SECRET = WEBHOOK_SECRET;

// ── Helpers ───────────────────────────────────────────────────────────────────

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2026-04-22.dahlia" });

function buildSignedRequest(payload: object): { req: Partial<Request>; res: Partial<Response> } {
  const body = JSON.stringify(payload);
  const header = stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret: WEBHOOK_SECRET,
  });

  const jsonMock = vi.fn();
  const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

  return {
    req: {
      headers: { "stripe-signature": header },
      body: Buffer.from(body),
    } as unknown as Partial<Request>,
    res: {
      json: jsonMock,
      status: statusMock,
    } as unknown as Partial<Response>,
  };
}

function buildEvent(
  eventType: string,
  dataObject: object = {},
  eventId = "evt_real_test"
): object {
  return {
    id: eventId,
    type: eventType,
    object: "event",
    data: { object: dataObject },
    livemode: false,
    created: Math.floor(Date.now() / 1000),
    api_version: "2026-04-22.dahlia",
    pending_webhooks: 1,
    request: null,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Stripe webhook handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockImplementation(() => ({ set: mockSet }));
    mockSet.mockImplementation(() => ({ where: mockWhere }));
    mockSelect.mockImplementation(() => ({ from: mockFrom }));
    mockFrom.mockImplementation(() => ({ where: mockWhere2 }));
    mockWhere2.mockImplementation(() => ({ limit: mockLimit }));
    mockLimit.mockResolvedValue([]);
    mockWhere.mockResolvedValue([]);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const { handleStripeWebhook } = await import("./stripe/webhook");
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    await handleStripeWebhook(
      { headers: {}, body: Buffer.from("{}") } as unknown as Request,
      { status: statusMock, json: jsonMock } as unknown as Response
    );

    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it("returns 400 when signature is invalid", async () => {
    const { handleStripeWebhook } = await import("./stripe/webhook");
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    await handleStripeWebhook(
      {
        headers: { "stripe-signature": "t=invalid,v1=badsig" },
        body: Buffer.from('{"id":"evt_bad"}'),
      } as unknown as Request,
      { status: statusMock, json: jsonMock } as unknown as Response
    );

    expect(statusMock).toHaveBeenCalledWith(400);
  });

  it("returns verified:true for test events (evt_test_ prefix)", async () => {
    const { handleStripeWebhook } = await import("./stripe/webhook");
    const { req, res } = buildSignedRequest(
      buildEvent("checkout.session.completed", {}, "evt_test_abc123")
    );

    await handleStripeWebhook(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ verified: true });
  });

  it("returns received:true for unhandled event types", async () => {
    const { handleStripeWebhook } = await import("./stripe/webhook");
    const { req, res } = buildSignedRequest(
      buildEvent("payment_method.attached", {}, "evt_real_unhandled")
    );

    await handleStripeWebhook(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("checkout.session.completed updates user subscription fields", async () => {
    const { handleStripeWebhook } = await import("./stripe/webhook");
    const sessionObject = {
      id: "cs_test_123",
      object: "checkout.session",
      mode: "subscription",
      customer: "cus_test_abc",
      subscription: "sub_test_xyz",
      client_reference_id: "42",
      metadata: { user_id: "42", plan: "yearly" },
    };
    const { req, res } = buildSignedRequest(
      buildEvent("checkout.session.completed", sessionObject, "evt_real_checkout")
    );

    await handleStripeWebhook(req as Request, res as Response);

    expect(mockUpdate).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeCustomerId: "cus_test_abc",
        stripeSubscriptionId: "sub_test_xyz",
        subscriptionStatus: "active",
        subscriptionPlan: "yearly",
      })
    );
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("invoice.paid sets subscriptionStatus to active", async () => {
    const { handleStripeWebhook } = await import("./stripe/webhook");
    const invoiceObject = {
      id: "in_test_123",
      object: "invoice",
      customer: "cus_test_abc",
    };
    const { req, res } = buildSignedRequest(
      buildEvent("invoice.paid", invoiceObject, "evt_real_invoice_paid")
    );

    await handleStripeWebhook(req as Request, res as Response);

    expect(mockSet).toHaveBeenCalledWith({ subscriptionStatus: "active" });
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("invoice.payment_failed sets subscriptionStatus to past_due", async () => {
    const { handleStripeWebhook } = await import("./stripe/webhook");
    const invoiceObject = {
      id: "in_test_456",
      object: "invoice",
      customer: "cus_test_abc",
    };
    const { req, res } = buildSignedRequest(
      buildEvent("invoice.payment_failed", invoiceObject, "evt_real_invoice_failed")
    );

    await handleStripeWebhook(req as Request, res as Response);

    expect(mockSet).toHaveBeenCalledWith({ subscriptionStatus: "past_due" });
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("customer.subscription.deleted clears subscription and sets canceled", async () => {
    const { handleStripeWebhook } = await import("./stripe/webhook");
    const subscriptionObject = {
      id: "sub_test_xyz",
      object: "subscription",
      customer: "cus_test_abc",
      status: "canceled",
    };
    const { req, res } = buildSignedRequest(
      buildEvent("customer.subscription.deleted", subscriptionObject, "evt_real_sub_deleted")
    );

    await handleStripeWebhook(req as Request, res as Response);

    expect(mockSet).toHaveBeenCalledWith({
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
      subscriptionPlan: null,
    });
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("customer.subscription.updated syncs status for active subscription", async () => {
    const { handleStripeWebhook } = await import("./stripe/webhook");
    const subscriptionObject = {
      id: "sub_test_xyz",
      object: "subscription",
      customer: "cus_test_abc",
      status: "active",
      items: { data: [{ price: { recurring: { interval: "month" } } }] },
    };
    const { req, res } = buildSignedRequest(
      buildEvent("customer.subscription.updated", subscriptionObject, "evt_real_sub_updated")
    );

    await handleStripeWebhook(req as Request, res as Response);

    expect(mockSet).toHaveBeenCalledWith({
      subscriptionStatus: "active",
      subscriptionPlan: "monthly",
    });
    expect(res.json).toHaveBeenCalledWith({ received: true });
  });

  it("customer.subscription.updated maps past_due stripe status correctly", async () => {
    const { handleStripeWebhook } = await import("./stripe/webhook");
    const subscriptionObject = {
      id: "sub_test_xyz",
      object: "subscription",
      customer: "cus_test_abc",
      status: "past_due",
    };
    const { req, res } = buildSignedRequest(
      buildEvent("customer.subscription.updated", subscriptionObject, "evt_real_sub_past_due")
    );

    await handleStripeWebhook(req as Request, res as Response);

    expect(mockSet).toHaveBeenCalledWith({ subscriptionStatus: "past_due" });
  });
});
