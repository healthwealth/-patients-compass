# Shopify Custom App Permissions and Webhooks

## Presentation script

### Slide 1 — Objective

**On slide:** Connect Shopify checkout safely to Patients Compass.

**Speaker notes:**

Today we will configure the Shopify app permissions needed for Patients Compass checkout and connect the Shopify webhook that keeps subscription and payment status synchronized. We will use the least permissions needed for the intended flow, keep all tokens server-side, and test the webhook with a signed payload before enabling production billing.

### Slide 2 — Confirm the correct store

**On slide:** `s064cx-hu.myshopify.com` · Patients Compass store

**Speaker notes:**

Before changing anything, verify that the active connector points to the intended Patients Compass store. Do not create products, selling plans, or webhooks if the API returns a different store. The permanent `myshopify.com` domain and the public primary domain are separate values and should be recorded separately.

### Slide 3 — Choose the app type

**On slide:** Partner app versus Admin-created custom app

**Speaker notes:**

If the app is owned by our organization, update it in the Shopify Partner Dashboard and publish the new configuration. If it is a Shopify Admin-created custom app, update its Admin API integration settings inside the store. A Manus-managed app can only receive new permissions from the app owner; the store owner cannot add arbitrary scopes to that app. This distinction determines whether the store administrator can finish the permission update directly or must ask the app owner to publish and reauthorize a new version.

### Slide 4 — Current integration status

**On slide:**

- `write_products`: present
- Storefront checkout scopes: present
- Purchase-options/subscription permission: pending
- Storefront-token capability: pending
- `orders/paid` webhook: registered

**Speaker notes:**

The integration is partially configured, not production-ready. Product-writing and checkout scopes are present, and the payment webhook is registered. Shopify has not yet granted the purchase-options or subscription permission needed to create selling plans, and Storefront-token creation still requires the app’s Storefront capability. We will not describe the Monthly and Yearly products as active recurring subscriptions until those items are complete.

### Slide 5 — Admin API permissions

**On slide:**

- `write_products`
- `write_purchase_options` or subscription-contract access
- Order-information permission requested by Shopify

**Speaker notes:**

`write_products` is needed to attach selling-plan groups to the subscription products. Shopify also requires purchase-options or subscription-contract access for selling-plan creation. The selling-plan mutation may additionally require an app or organization-level order-information management permission. That order-information permission is separate from the OAuth scope list returned by `currentAppInstallation.accessScopes`; it should be checked in the Shopify app or Partner Dashboard configuration. These permissions are separate from ordinary product read access.

### Slide 6 — Storefront API permissions

**On slide:**

- `unauthenticated_read_product_listings`
- `unauthenticated_read_selling_plans`
- `unauthenticated_read_checkouts`
- `unauthenticated_write_checkouts`

**Speaker notes:**

The checkout adapter creates a Storefront cart and sends the shopper to Shopify checkout. Enable the Storefront API, Headless channel, or equivalent sales-channel capability first. Then request the unauthenticated product, selling-plan, and checkout scopes required by the cart flow. Storefront-token creation is not guaranteed for every generic custom app, so verify that the app is configured as a Storefront-capable app.

### Slide 7 — Save, publish, and reinstall

**On slide:** Configuration → Save → Publish → Reinstall or reauthorize

**Speaker notes:**

After changing permissions, save the configuration. If Shopify requires an app release, publish it. Then reinstall or reauthorize the app on the Patients Compass store. A permission change is not active merely because it was edited in the dashboard; the store must receive the updated grant.

### Slide 8 — Verify scopes without exposing tokens

**On slide:** `check_shopify_scopes.py`

**Speaker notes:**

Use the read-only scope checker with a server-side Admin API token. It queries `currentAppInstallation.accessScopes`, prints only scope names and pass/fail status, and returns exit code 2 when required scopes are missing. Never paste an access token into source control, a browser bundle, or a chat message.

### Slide 9 — Register the webhook

**On slide:**

```text
POST https://thepatientscompass.com/api/shopify/webhook
Topic: ORDERS_PAID
Format: JSON
```

**Speaker notes:**

Register `orders/paid` only after checking that an identical webhook does not already exist. The Patients Compass endpoint receives the raw request body before JSON parsing. It verifies the HMAC signature, Shopify shop domain, topic, and unique webhook ID, then applies idempotency protection.

### Slide 10 — Configure server secrets

**On slide:** Server-only encrypted secrets

**Speaker notes:**

Configure the Shopify store domain, webhook shop domain, webhook secret, Storefront token, variant IDs, and selling-plan IDs in the hosting provider’s encrypted secret manager. Do not use `VITE_` names for these values. Restart or redeploy after saving them.

### Slide 11 — Test before launch

**On slide:** Signed mock request → HTTP 200 → duplicate request ignored

**Speaker notes:**

Use the bundled webhook test script with a non-production test identity. It signs the exact JSON bytes with HMAC-SHA256 and sends the required Shopify headers:

```bash
export SHOPIFY_WEBHOOK_SECRET='same-secret-as-server'
export SHOPIFY_WEBHOOK_SHOP_DOMAIN=s064cx-hu.myshopify.com
export WEBHOOK_URL=https://thepatientscompass.com/api/shopify/webhook
export SHOPIFY_TEST_USER_EMAIL=shopify-test@example.com

bash scripts/test_shopify_webhook.sh orders/paid
SHOPIFY_TEST_DUPLICATE=1 bash scripts/test_shopify_webhook.sh orders/paid
```

Confirm an HTTP 200 response. Send the same webhook ID again and confirm that the second request is recognized as a duplicate and does not apply the event twice. A successful delivery test proves transport, signature validation, and idempotency; it does not prove that a user was updated unless the test email or user ID matches a non-production Patients Compass account.

### Slide 12 — Production-readiness checklist

**On slide:**

- Scope checker exits with code `0`
- Correct store verified
- Monthly and Yearly selling plans attached
- Storefront cart tested with the matching selling-plan IDs
- Webhook returns HTTP 200
- Duplicate webhook ID is ignored
- A matched test user is updated correctly
- No secrets in logs or client code

**Speaker notes:**

The integration is ready for production only when every item is complete. Products alone are not recurring subscriptions. The Monthly and Yearly plans must exist and their selling-plan IDs must be configured before the pricing flow is described as recurring billing. Keep “webhook delivery verified” separate from “subscription synchronization verified” in release notes and stakeholder updates.

## Operator commands

```bash
cd /home/ubuntu/skills/shopify-patients-compass-setup
export SHOPIFY_ADMIN_STORE_DOMAIN=s064cx-hu.myshopify.com
export SHOPIFY_ADMIN_ACCESS_TOKEN='server-side-admin-token'
python3 scripts/check_shopify_scopes.py
```

The checker is read-only and never prints the token.
