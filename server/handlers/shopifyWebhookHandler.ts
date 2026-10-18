import crypto from "node:crypto";
import { Request, Response } from "express";
import { eq, or } from "drizzle-orm";
import { getDb } from "../db";
import { shopifyWebhookEvents, users } from "../../drizzle/schema";
import { ENV } from "../_core/env";

type ShopifyPayload = Record<string, any>;

function headerValue(req: Request, name: string) {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function verifyShopifySignature(rawBody: Buffer, signature: string) {
  if (!ENV.shopifyWebhookSecret || !signature) return false;
  const digest = crypto.createHmac("sha256", ENV.shopifyWebhookSecret).update(rawBody).digest("base64");
  const expected = Buffer.from(digest, "utf8");
  const actual = Buffer.from(signature, "utf8");
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function normalizeId(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function firstValue(...values: unknown[]) {
  return values.map(normalizeId).find(Boolean);
}

function attributeValue(payload: ShopifyPayload, key: string) {
  const attributes = [payload.attributes, payload.note_attributes, payload.noteAttributes].find(Array.isArray) as Array<any> | undefined;
  return attributes?.find(item => item?.key === key || item?.name === key)?.value;
}

function inferPlan(payload: ShopifyPayload): "monthly" | "yearly" | undefined {
  const explicit = String(attributeValue(payload, "patients_compass_plan") ?? payload.plan ?? "").toLowerCase();
  if (explicit.includes("year")) return "yearly";
  if (explicit.includes("month")) return "monthly";
  const text = JSON.stringify(payload).toLowerCase();
  if (text.includes("yearly") || text.includes("annual")) return "yearly";
  if (text.includes("monthly")) return "monthly";
  return undefined;
}

function inferStatus(topic: string, payload: ShopifyPayload): "free" | "active" | "canceled" | "past_due" {
  const source = String(payload.status ?? payload.subscription_status ?? "").toLowerCase();
  if (topic.includes("cancel") || topic.includes("expire") || source === "cancelled" || source === "canceled" || source === "expired") return "canceled";
  if (topic.includes("fail") || topic.includes("pause") || source === "paused" || source === "past_due") return "past_due";
  if (source === "active" || topic.includes("create") || topic.includes("resume") || topic.includes("update") || topic === "orders/paid") return "active";
  return "free";
}

async function processShopifyEvent(topic: string, shopDomain: string, payload: ShopifyPayload, db: any) {
  const customerId = firstValue(
    payload.customer?.admin_graphql_api_id,
    payload.customer?.id,
    payload.customer_id,
    payload.customerId,
  );
  const isSubscriptionTopic = topic.includes("subscription_contract");
  const orderId = topic.startsWith("orders/") || topic === "refunds/create"
    ? firstValue(payload.admin_graphql_api_id, payload.id, payload.order_id)
    : undefined;
  const subscriptionId = isSubscriptionTopic
    ? firstValue(payload.admin_graphql_api_id, payload.id, payload.subscription_contract_id, payload.subscriptionContractId)
    : firstValue(payload.subscription_contract?.admin_graphql_api_id, payload.subscription_contract?.id);
  const userId = firstValue(attributeValue(payload, "patients_compass_user_id"), payload.client_reference_id);
  const email = payload.email ?? payload.customer?.email ?? payload.billing_address?.email;
  const predicates = [];
  if (userId && /^\d+$/.test(userId)) predicates.push(eq(users.id, Number(userId)));
  if (email) predicates.push(eq(users.email, String(email).toLowerCase()));
  if (customerId) predicates.push(eq(users.shopifyCustomerId, customerId));
  if (!predicates.length) {
    console.warn(`[Shopify Webhook] Could not identify a Patients Compass user for ${topic}`);
    return;
  }

  const [user] = await db.select().from(users).where(or(...predicates)).limit(1);
  if (!user) {
    console.warn(`[Shopify Webhook] User not found for ${topic}`);
    return;
  }

  const status = inferStatus(topic, payload);
  const plan = inferPlan(payload);
  await db.update(users).set({
    shopifyCustomerId: customerId ?? user.shopifyCustomerId,
    shopifySubscriptionContractId: subscriptionId ?? user.shopifySubscriptionContractId,
    shopifyOrderId: orderId ?? user.shopifyOrderId,
    shopifyShopDomain: shopDomain,
    subscriptionStatus: status,
    ...(plan ? { subscriptionPlan: plan } : {}),
    updatedAt: new Date(),
  }).where(eq(users.id, user.id));
}

export async function handleShopifyWebhook(req: Request, res: Response) {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? "");
  const signature = headerValue(req, "x-shopify-hmac-sha256");
  const shopDomain = headerValue(req, "x-shopify-shop-domain");
  const topic = headerValue(req, "x-shopify-topic") ?? "unknown";
  const webhookId = headerValue(req, "x-shopify-webhook-id");

  if (!ENV.shopifyWebhookSecret) return res.status(503).json({ error: "Shopify webhook is not configured" });
  if (!verifyShopifySignature(rawBody, String(signature ?? ""))) return res.status(401).json({ error: "Invalid signature" });
  if (!shopDomain || (ENV.shopifyWebhookShopDomain && shopDomain !== ENV.shopifyWebhookShopDomain)) {
    return res.status(403).json({ error: "Unknown Shopify shop" });
  }
  if (!webhookId) return res.status(400).json({ error: "Missing Shopify webhook ID" });

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const [existing] = await db.select().from(shopifyWebhookEvents).where(eq(shopifyWebhookEvents.id, webhookId)).limit(1);
  if (existing?.processedAt) return res.status(200).json({ received: true, duplicate: true });
  if (!existing) {
    await db.insert(shopifyWebhookEvents).values({ id: webhookId, topic: String(topic), shopDomain: String(shopDomain) });
  }

  try {
    const payload = JSON.parse(rawBody.toString("utf8")) as ShopifyPayload;
    await processShopifyEvent(String(topic), String(shopDomain), payload, db);
    await db.update(shopifyWebhookEvents).set({ processedAt: new Date() }).where(eq(shopifyWebhookEvents.id, webhookId));
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Shopify Webhook] Processing failed:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}

export { verifyShopifySignature, inferPlan, inferStatus };
