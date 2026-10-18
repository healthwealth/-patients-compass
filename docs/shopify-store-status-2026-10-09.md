# Patients Compass Shopify Store Status

**Checked:** 2026-10-09 23:13 UTC

## Connection verification

The Shopify connector is connected to the intended store.

| Field | Current value |
|---|---|
| Shopify store name | My Store |
| Shopify permanent domain (`myshopifyDomain`) | `s064cx-hu.myshopify.com` |
| Shopify primary domain | `patientcompashealth.myshopify.com` |
| Shopify primary-domain URL | `https://patientcompashealth.myshopify.com` |
| Manus active account name | My Store |
| Manus active account UID | `fc392d85-c798-45a0-9e69-9bec9b7c6233` |
| Manus connector UID | `8b81dcd8-d524-48ff-8360-7065e3088f57` |

> The store’s current permanent Shopify API domain is `s064cx-hu.myshopify.com`, while its configured primary domain is `patientcompashealth.myshopify.com`. Keep both values available when configuring webhook shop-domain validation.

## Live catalog and order test

- **Active product catalog:** no products found.
- **Recent order list:** no orders found.
- This is expected for a newly created store. Monthly and Yearly subscription products still need to be created before checkout can produce a cart containing a selling plan.

## Webhook status

The live Shopify API currently reports **zero webhook subscriptions**.

Patients Compass already exposes the HMAC-protected endpoint:

```text
POST https://thepatientscompass.com/api/shopify/webhook
```

The server registers this route before JSON parsing so it can verify the exact raw request body. It validates:

- `X-Shopify-Hmac-Sha256`
- `X-Shopify-Shop-Domain`
- `X-Shopify-Topic`
- `X-Shopify-Webhook-Id`
- duplicate webhook IDs for idempotent processing

The handler maps customer, order, refund, and subscription-contract events to the Patients Compass user record and stores Shopify identifiers/status values.

## Required server configuration

The application environment expects these server-side values:

```text
SHOPIFY_STORE_DOMAIN=s064cx-hu.myshopify.com
SHOPIFY_WEBHOOK_SHOP_DOMAIN=s064cx-hu.myshopify.com
SHOPIFY_WEBHOOK_SECRET=<the shared secret used to sign Shopify webhooks>
```

Use the permanent `myshopifyDomain` for `SHOPIFY_WEBHOOK_SHOP_DOMAIN` unless a test webhook confirms that Shopify sends the primary domain in `X-Shopify-Shop-Domain`. Never expose the webhook secret in client code, source control, or chat.

The checkout adapter also expects, after products are created:

```text
SHOPIFY_MONTHLY_VARIANT_ID=<monthly product variant ID>
SHOPIFY_YEARLY_VARIANT_ID=<yearly product variant ID>
SHOPIFY_MONTHLY_SELLING_PLAN_ID=<monthly selling plan ID>
SHOPIFY_YEARLY_SELLING_PLAN_ID=<yearly selling plan ID>
SHOPIFY_STOREFRONT_ACCESS_TOKEN=<server-side Storefront token>
```

## How to configure automated webhook sync

### Shopify Admin UI

1. Open the new store admin: `https://admin.shopify.com/store/patientcompashealth`.
2. Go to **Settings → Notifications → Webhooks**.
3. Create webhook subscriptions pointing to:
   `https://thepatientscompass.com/api/shopify/webhook`.
4. Use JSON format and the latest API version supported by the store.
5. Add the topics required by the billing flow:
   - `orders/paid`
   - `orders/cancelled`
   - `refunds/create`
   - subscription-contract create/update/cancel events, if the selected Shopify subscription implementation exposes those topics
6. Copy the webhook signing secret into the protected `SHOPIFY_WEBHOOK_SECRET` environment setting.
7. Set `SHOPIFY_WEBHOOK_SHOP_DOMAIN` to the domain Shopify sends in the webhook header; start with `s064cx-hu.myshopify.com`.
8. Send a Shopify test webhook and confirm the endpoint returns HTTP 200.

### Admin GraphQL API alternative

Webhook subscriptions can also be created with Shopify’s `webhookSubscriptionCreate` mutation. The essential shape is:

```graphql
mutation CreateWebhook($topic: WebhookSubscriptionTopic!, $uri: String!) {
  webhookSubscriptionCreate(
    topic: $topic
    webhookSubscription: { uri: $uri, format: JSON }
  ) {
    webhookSubscription { id topic uri }
    userErrors { field message }
  }
}
```

Use the endpoint URI:

```text
https://thepatientscompass.com/api/shopify/webhook
```

Create each topic separately and record the returned subscription IDs. After creation, verify with:

```graphql
query {
  webhookSubscriptions(first: 50) {
    nodes { id topic uri format }
  }
}
```

## Recommended next sequence

1. Create the Monthly and Yearly products.
2. Add recurring selling plans using an eligible Shopify subscription implementation.
3. Record the variant and selling-plan IDs in the Patients Compass server environment.
4. Configure the webhook subscriptions above.
5. Send a signed test webhook and inspect server logs/database idempotency records.
6. Run a sandbox checkout test before publishing the billing flow.

> Shopify’s subscription research notes that custom-app limitations may apply to recurring purchase features. Confirm the selected subscription implementation is eligible for the store before relying on subscription-contract webhooks.

## Verification update (2026-10-14)

- The configured Storefront credential was normalized to the single raw 32-character token embedded in the supplied wrapper; the token now passes a read-only Storefront GraphQL query.
- Monthly and Yearly variant IDs resolve through Storefront API and live `cartCreate` checks created non-payment carts successfully.
- The Family variant `gid://shopify/ProductVariant/50653193207973` also created a non-payment cart successfully. Shopify returned its canonical checkout hostname as `patientcompashealth.myshopify.com`.
- Project validation passed: TypeScript, 61 test files with 332 passing tests and 29 skipped, and production build.
- The active webhook list contains `ORDERS_PAID` at `https://thepatientscompass.com/api/shopify/webhook`.
- Shopify currently reports no selling-plan groups on the Monthly or Yearly products. Attempts to register subscription-contract and billing-attempt topics were rejected with `You cannot create a webhook subscription with the specified topic`, indicating the connected app still needs the subscription-contract scope/authorization. No subscription webhook was claimed as configured.

Official references consulted:
- https://shopify.dev/docs/api/admin-graphql/latest/mutations/storefrontAccessTokenCreate
- https://shopify.dev/docs/api/admin-graphql/latest/enums/WebhookSubscriptionTopic
- https://shopify.dev/docs/api/admin-graphql/latest/mutations/webhookSubscriptionCreate
