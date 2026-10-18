# Patients Compass Digital Products — Webhooks, Checkout Branding, and Presentation Script

## 1. What the webhook should represent

Shopify's Digital Products app handles the secure file link and the customer email. Your Patients Compass endpoint should receive fulfillment-related notifications for internal synchronization, audit logging, and optional customer-library updates.

For fulfillment completion, use these Shopify webhook subscriptions:

- `fulfillments/create` — a fulfillment record is created.
- `fulfillments/update` — a fulfillment changes state.
- `orders/fulfilled` — the order reaches fulfilled status, if the store exposes this topic in the selected API version.

For a purely digital order, the most useful test signal is normally `fulfillments/create` or `fulfillments/update`, while the Digital Products app remains responsible for the download email.

The current Patients Compass endpoint is:

```text
POST /api/shopify/webhook
```

The deployed endpoint must be an HTTPS URL such as:

```text
https://thepatientscompass.com/api/shopify/webhook
```

Do not register `localhost`, a Shopify domain, or a placeholder domain as the webhook destination.

## 2. Register or verify the webhook

In Shopify Admin:

1. Open **Settings → Notifications → Webhooks**.
2. Choose **Create webhook**.
3. Select **Fulfillment creation**.
4. Choose **JSON**.
5. Enter the deployed HTTPS endpoint.
6. Select the current webhook API version.
7. Save.
8. Repeat for **Fulfillment update** if you need later status changes.
9. Open the webhook row menu and choose **Send test**.

Shopify also supports app-specific registration through the `webhookSubscriptionCreate` Admin GraphQL mutation. A representative mutation is:

```graphql
mutation CreateFulfillmentWebhook($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
  webhookSubscriptionCreate(
    topic: $topic
    webhookSubscription: $webhookSubscription
  ) {
    webhookSubscription {
      id
      topic
      uri
      format
    }
    userErrors {
      field
      message
    }
  }
}
```

Variables:

```json
{
  "topic": "FULFILLMENTS_CREATE",
  "webhookSubscription": {
    "uri": "https://thepatientscompass.com/api/shopify/webhook",
    "format": "JSON"
  }
}
```

Use Shopify's current webhook-topic enum for the API version in your store. If the API rejects `FULFILLMENTS_CREATE`, use the exact topic value returned by Shopify's schema or register the event through the Admin webhook UI.

## 3. Signed local test

The Patients Compass handler verifies the HMAC over the exact raw request body. Generate the signature and send the payload without reformatting it between signing and delivery.

Set the same secret configured as `SHOPIFY_WEBHOOK_SECRET` in the server environment:

```bash
export SHOPIFY_WEBHOOK_SECRET='replace-with-the-configured-webhook-secret'
export WEBHOOK_URL='https://thepatientscompass.com/api/shopify/webhook'

node <<'NODE' > /tmp/patients-compass-fulfillment-request.sh
const crypto = require('node:crypto');
const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
const body = JSON.stringify({
  id: 987654321,
  order_id: 123456789,
  status: "success",
  email: "webhook-test@example.com",
  created_at: "2026-10-14T22:00:00Z",
  updated_at: "2026-10-14T22:00:00Z",
  line_items: [
    {
      id: 111222333,
      title: "Doctor Visit Preparation Workbook",
      product_id: 10830000000000,
      variant_id: 50640000000000,
      quantity: 1,
      requires_shipping: false
    }
  ]
});
const hmac = crypto.createHmac('sha256', secret).update(body).digest('base64');
const request = `curl --fail-with-body -i -X POST "$WEBHOOK_URL" \\\n  -H 'Content-Type: application/json' \\\n  -H 'X-Shopify-Hmac-SHA256: ${hmac}' \\\n  -H 'X-Shopify-Shop-Domain: s064cx-hu.myshopify.com' \\\n  -H 'X-Shopify-Topic: fulfillments/create' \\\n  -H 'X-Shopify-Webhook-Id: local-fulfillment-test-001' \\\n  --data-raw '${body.replaceAll("'", "'\\''")}'`;
console.log(request);
NODE

bash /tmp/patients-compass-fulfillment-request.sh
```

Expected endpoint response:

```json
{"received":true}
```

If you repeat the same request with the same `X-Shopify-Webhook-Id`, the endpoint should return:

```json
{"received":true,"duplicate":true}
```

That confirms idempotency protection is working.

### Negative tests

Invalid signature:

```bash
curl --fail-with-body -i -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -H 'X-Shopify-Hmac-SHA256: invalid' \
  -H 'X-Shopify-Shop-Domain: s064cx-hu.myshopify.com' \
  -H 'X-Shopify-Topic: fulfillments/create' \
  -H 'X-Shopify-Webhook-Id: local-fulfillment-invalid-001' \
  --data-raw '{"id":987654321}'
```

Expected response: HTTP `401` with `{"error":"Invalid signature"}`.

Wrong shop domain:

```bash
curl --fail-with-body -i -X POST "$WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -H 'X-Shopify-Hmac-SHA256: use-a-valid-signature-for-this-body' \
  -H 'X-Shopify-Shop-Domain: another-store.myshopify.com' \
  -H 'X-Shopify-Topic: fulfillments/create' \
  -H 'X-Shopify-Webhook-Id: local-fulfillment-domain-001' \
  --data-raw '{}'
```

Expected response after signature validation: HTTP `403` for an unknown shop. Generate a valid signature for the exact body if you want to reach the domain check.

### Shopify dashboard test

After the local signed test:

1. Use Shopify Admin → **Settings → Notifications → Webhooks**.
2. Open the fulfillment webhook menu.
3. Choose **Send test**.
4. Inspect the server response and application logs.
5. Confirm the webhook ID is stored once in `shopifyWebhookEvents`.
6. Confirm a repeated delivery is ignored.

Shopify requires a fast successful response. Verify HMAC and deduplicate before doing slow work, then return HTTP 200 quickly. [1] [2]

## 4. End-to-end digital fulfillment test

Use a Shopify test payment and a test customer email:

1. Create or confirm a digital product variant with `requiresShipping: false`.
2. Attach its PDF in **Apps → Digital Products**.
3. Set **Delivery method → Send automatically**.
4. Enable the Digital Products block on the Thank you and Order status pages.
5. Start checkout from the product page.
6. Use Shopify's supported test payment method.
7. Confirm the order is marked paid.
8. Confirm the fulfillment webhook arrives at `/api/shopify/webhook`.
9. Confirm the ready email arrives at the test inbox.
10. Open the Order status page and test the secure download link.
11. Open the branded customer account section and click **Open downloads** for that order.
12. Test the same link on a mobile device.

The fulfillment webhook is an internal synchronization signal. It is not the file itself, and the webhook payload should not be treated as a download URL.

## 5. Calm clinical editorial checkout branding

Shopify Admin path:

```text
Settings → Checkout → Configurations → Edit → checkout and accounts editor
```

Apply these settings:

| Area | Recommended value |
|---|---|
| Logo | Patients Compass logo with transparent background |
| Logo alignment | Left |
| Header background | `#F8F5EF` or soft warm ivory |
| Main background | `#F8F5EF` |
| Base text | `#2D2926` |
| Primary accent | `#769889` sage |
| Primary button background | `#769889` |
| Primary button text | `#FFFFFF` |
| Strong accent / headings | `#134E4A` deep teal |
| Supporting accent | `#D18D73` muted terracotta |
| Borders | `#D3D0C9` warm gray |
| Corner radius | Medium or large, consistent with the website |
| Typography | Shopify's clean sans-serif paired with the closest available editorial heading font |

### Manual steps

1. Open **Settings → Checkout**.
2. Click **Edit** next to the active checkout configuration.
3. In **Settings**, add the logo from the Shopify file library.
4. Set the logo width so it remains legible on mobile.
5. Create a color palette with the hex values above.
6. Set the main content background to warm ivory.
7. Set the header background to warm ivory or a very light sage tint.
8. Set button and accent colors to sage.
9. Set text to deep brown rather than pure black.
10. Set headings and key links to deep teal.
11. Choose the closest available typography option.
12. Review the mobile checkout preview.
13. Save the draft configuration.
14. Test a digital-product checkout before publishing the configuration.

The standard checkout editor supports the logo, palette, backgrounds, buttons, fields, and fonts. Shopify applies some of these choices to new customer account pages as well. [3]

### API note

Shopify's `checkoutBrandingUpsert` API is restricted to Shopify Plus for advanced programmatic checkout styling. For the current store, use the checkout and accounts editor unless the store is on Shopify Plus and the app has the required permissions. [4]

Do not try to inject the website's CSS into Shopify checkout. Shopify checkout is a protected surface; use the editor or the supported branding API.

---

# Presentation script: Patients Compass digital products and fulfillment workflow

## Slide 1 — A practical digital resource library

**On-slide message**

Patients Compass digital education resources.

**Speaker script**

The digital-product catalog extends Patients Compass with practical, focused tools that customers can purchase once. These resources support better preparation and education without presenting themselves as medical diagnosis or treatment.

## Slide 2 — Catalog and price ladder

**On-slide message**

- Start Here Health Organization Workbook — $7
- Doctor Visit Preparation Workbook — $12
- Lab Results Conversation Guide — $15
- Clinical Conversation Toolkit — $29
- Patients Compass Starter Bundle — $39
- Healthy Habits for Super Kids Activity Pack — Free

**Speaker script**

The catalog moves from an accessible entry workbook to larger toolkits and bundles. The free Super Kids Activity Pack remains a public family resource and discovery channel.

## Slide 3 — How the catalog is created

**On-slide message**

Admin API automation

1. Create a product.
2. Configure the initial variant.
3. Set price and non-shipping behavior.
4. Keep the product in draft.
5. Publish after asset testing.

**Speaker script**

The Node.js automation is dry-run-first. It prevents duplicate handles, creates products as drafts, sets prices, and marks the inventory item as non-shipping. Publishing is a separate explicit step after the digital files are ready.

## Slide 4 — Digital asset delivery

**On-slide message**

Digital Products app

- Attach PDF, ZIP, or supported link
- Send automatically
- Configure access limits
- Customize ready email

**Speaker script**

Shopify's Digital Products app owns the secure download asset and the email-delivery lifecycle. Product creation alone does not deliver a file. Each product variant must have a real asset attached and an automatic delivery setting.

## Slide 5 — Fulfillment webhook architecture

**On-slide message**

Checkout payment → Digital Products fulfillment → Webhook → Patients Compass sync

**Speaker script**

The customer pays through Shopify. The Digital Products app fulfills the digital item and sends the secure email. A fulfillment webhook notifies Patients Compass so the application can record the event, update its internal library, or trigger non-sensitive operational workflows.

## Slide 6 — Secure webhook testing

**On-slide message**

- Raw-body HMAC verification
- Shop-domain validation
- Delivery-ID deduplication
- Fast HTTP 200 response
- No file URLs in webhook payloads

**Speaker script**

Every webhook test must use the exact raw body that was signed. The endpoint validates the HMAC, checks the Shopify domain, deduplicates the delivery ID, and responds quickly. The webhook is a notification, not a replacement for the secure download link.

## Slide 7 — Customer re-download flow

**On-slide message**

Account page → Order status → Secure download

**Speaker script**

The branded account section lists purchased orders. Selecting an order opens Shopify's order-status page, where the Digital Products block exposes the secure download link. This avoids placing permanent storage URLs in Liquid templates.

## Slide 8 — Calm clinical editorial checkout

**On-slide message**

Warm ivory · sage · deep teal · muted terracotta

**Speaker script**

Checkout should feel like a quiet extension of the Patients Compass website. Use warm ivory for the surface, sage for actions, deep teal for hierarchy, muted terracotta sparingly, and warm brown for readable body text. Keep the logo clear and the mobile layout simple.

## Slide 9 — End-to-end test gate

**On-slide message**

- Test payment succeeds
- Fulfillment webhook arrives
- Event is stored once
- Ready email arrives
- Download works on desktop and mobile
- Customer account links to order status

**Speaker script**

The production gate combines payment, fulfillment, notification, account access, and download testing. We should not publish a digital product until every step works with a test customer and no sensitive health information.

## Slide 10 — Launch principle

**On-slide message**

Helpful education. Clear boundaries. Secure delivery.

**Speaker script**

The catalog should make health education more accessible while preserving clear boundaries. Products are educational resources, checkout is branded consistently, fulfillment is automated through Shopify, and download access stays protected by Shopify's delivery system.

## References

[1]: https://shopify.dev/docs/apps/build/webhooks/verify-deliveries "Shopify webhook delivery verification"
[2]: https://shopify.dev/docs/api/webhooks/latest "Shopify webhook topics and delivery structure"
[3]: https://help.shopify.com/en/manual/checkout-settings/customize-checkout-configurations/checkout-style "Shopify checkout style customization"
[4]: https://shopify.dev/docs/apps/build/checkout/styling "Shopify checkout branding API and Plus limitations"
