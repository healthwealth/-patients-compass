# Patients Compass Shopify Subscription and Theme Branding

## Presentation script

**Audience:** Patients Compass project owner, Shopify administrator, and integration implementer  
**Purpose:** Explain how to propagate subscription-contract scopes, verify the connector, prepare checkout tests without payment, and finish storefront branding safely.

---

## Slide 1 — Objective and current state

**On-slide points**

- Move Patients Compass billing to Shopify.
- Support Monthly, Yearly, and Family plans.
- Enable subscription-contract event synchronization.
- Match the Shopify storefront to Patients Compass branding.
- Avoid real payment submission during validation.

**Speaker script**

Patients Compass is already connected to the intended Shopify store, `s064cx-hu.myshopify.com`, whose primary domain is `patientcompashealth.myshopify.com`. The catalog contains active Monthly, Yearly, and Family products, and the application can create non-payment Storefront carts. The remaining integration issue is that the released subscription-enabled app version has not yet propagated its new scopes to the Manus connector installation.

---

## Slide 2 — Important distinction: release versus connector installation

**On-slide points**

- Shopify Dev Dashboard app version: released.
- Store installation: reauthorized.
- Manus connector token: still reports the previous scope set.
- A release does not automatically upgrade every existing token.

**Speaker script**

There are three separate states to distinguish. First, the app version must be released in the Shopify Dev Dashboard. Second, the store installation must approve the updated access request. Third, the specific Manus Shopify connector token must be refreshed or reconnected. In this case, the first two actions were completed, but the connector query still returns the old scopes. Therefore, subscription support is not yet considered active through the application connector.

---

## Slide 3 — Exact subscription-contract scopes

**On-slide points**

```text
read_own_subscription_contracts
write_own_subscription_contracts
```

**Speaker script**

Shopify’s official subscription-contract documentation identifies these two scopes as the contract API requirement. The read scope is also required by subscription-contract webhook topics such as create, update, cancel, pause, activate, expire, and billing-attempt success or failure. The write scope is needed when the integration creates or changes subscription contracts.

Shopify also states that admin-created legacy custom apps cannot use protected subscription purchase features. A single-store implementation should use an app created in the Shopify Dev Dashboard or an eligible subscription app.

---

## Slide 4 — Supporting scopes for the Patients Compass flow

**On-slide points**

```text
read_products
write_products
read_orders
read_customers
unauthenticated_read_product_listings
unauthenticated_read_selling_plans
unauthenticated_read_checkouts
unauthenticated_write_checkouts
```

**Speaker script**

The two contract scopes are not the complete application requirement. Patients Compass also needs product and variant access, order synchronization, customer matching, selling-plan visibility, and Storefront cart creation. These supporting scopes should remain in the released app configuration and be visible after connector reauthorization.

The connector already has several product, order, customer, and Storefront scopes, but the two `*_own_subscription_contracts` scopes are not present in its current installation response.

---

## Slide 5 — Exact read-only scope verification query

**On-slide points**

```graphql
query AccessScopeList {
  currentAppInstallation {
    accessScopes {
      handle
    }
  }
}
```

**Speaker script**

This query is read-only. Run it against the Admin GraphQL API using the same installation or connector that the application will use. Do not paste access tokens into presentation material, source control, or chat. The verification is successful only when the response contains both `read_own_subscription_contracts` and `write_own_subscription_contracts`, plus the supporting product, order, customer, selling-plan, and Storefront scopes.

A useful checklist is:

```text
read_own_subscription_contracts       present?
write_own_subscription_contracts      present?
read_products                         present?
write_products                        present?
read_orders                           present?
read_customers                        present?
unauthenticated_read_selling_plans   present?
unauthenticated_write_checkouts      present?
```

---

## Slide 6 — Connector reconnection procedure

**On-slide points**

1. Release the subscription-enabled app version.
2. Open Manus Settings → Connectors → Shopify.
3. Reconnect Shopify.
4. Select **My Store / patientcompashealth**.
5. Complete Shopify authorization.
6. Verify scopes with the query from Slide 5.
7. Confirm the active account UID is unchanged and points to My Store.

**Speaker script**

The GraphQL query verifies permissions; it does not reconnect a connector. Reconnection must happen through the connector management flow. After reconnecting, select the intended My Store account rather than another known Shopify account. Then run the scope query again. If the new scopes still do not appear, the Dev Dashboard app installation and the Manus-managed connector token are separate installations. In that case, the Manus connector owner must refresh the installation or update its managed app permissions; repeated Shopify Admin reauthorization will not change the existing connector token.

Never switch to the Nutrition Advice or sportgolfshop.com accounts.

---

## Slide 7 — Subscription webhooks

**On-slide points**

- Existing: `ORDERS_PAID`
- Endpoint: `https://thepatientscompass.com/api/shopify/webhook`
- Required scope for contract topics: `read_own_subscription_contracts`
- Suggested topics:
  - `SUBSCRIPTION_CONTRACTS_CREATE`
  - `SUBSCRIPTION_CONTRACTS_UPDATE`
  - `SUBSCRIPTION_CONTRACTS_CANCEL`
  - `SUBSCRIPTION_CONTRACTS_PAUSE`
  - `SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS`
  - `SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE`

**Speaker script**

The orders-paid webhook is already registered. Subscription topics should be registered only after the connector returns the required read scope and a valid subscription implementation exists. Shopify previously rejected these topics because the connected installation was not eligible or authorized. After reauthorization, register topics one at a time and verify the returned user errors. Do not claim subscription webhooks are active merely because the app version contains the scopes.

---

## Slide 8 — Non-payment checkout preparation

**On-slide points**

| Plan | Variant ID | Price | Test state |
|---|---|---:|---|
| Monthly | `gid://shopify/ProductVariant/50643736723621` | $9.00 | Cart created |
| Yearly | `gid://shopify/ProductVariant/50643739410597` | $99.99 | Cart created |
| Family | `gid://shopify/ProductVariant/50653193207973` | $19.99 | Cart created |

**Speaker script**

The application prepared one Storefront cart for each plan. These operations create carts and checkout URLs but do not open checkout, collect payment details, submit an order, or charge a customer. All three checkout URLs resolve to the canonical Shopify checkout host, `patientcompashealth.myshopify.com`.

For recurring Monthly and Yearly checkout, the final test must wait until valid selling-plan IDs exist. A product or variant alone is not proof of recurring billing.

---

## Slide 9 — Safe live-test sequence

**On-slide points**

1. Open Monthly checkout and confirm name and price.
2. Repeat for Yearly.
3. Repeat for Family.
4. Stop before payment for display-only validation.
5. Use Shopify test payment mode for an actual test order.
6. Verify the order and webhook synchronization.

**Speaker script**

For a display-only test, stop before payment details. For a real test order, enable Shopify’s test-payment configuration first and use only the test method. Test one plan at a time. Confirm the product, amount, checkout host, order creation, `orders/paid` delivery, HMAC verification, user matching, subscription status, and duplicate-event handling. Do not use a real card while this integration is still being validated.

---

## Slide 10 — Theme branding: logo

**On-slide points**

- Online Store → Themes → Customize.
- Open Header.
- Upload the Patients Compass logo.
- Use a transparent, high-contrast PNG or SVG.
- Set separate desktop and mobile widths.
- Confirm the logo links to the storefront home.

**Speaker script**

The logo should be recognizable at small sizes and should not force the header to wrap or create horizontal scrolling. Preview at desktop, tablet, and mobile widths. If the theme editor is blank or still loading, do not paste instructions from the page or expose credentials. Reload the editor or open it from the Online Store Themes page once the Shopify UI is healthy.

---

## Slide 11 — Theme branding: colors

**On-slide points**

- Theme settings → Colors.
- Deep teal or green for primary actions.
- Warm cream or white for surfaces.
- Charcoal for body text.
- High-contrast accent for links and buttons.
- Check contrast before saving.

**Speaker script**

The storefront should feel like Patients Compass rather than a generic Shopify shop. Use the site’s established teal/green health-education palette, warm neutral surfaces, and dark readable text. Keep primary and secondary actions visually distinct. Validate contrast and focus states before saving, especially for announcement-bar text and buttons.

---

## Slide 12 — Theme branding: announcement bar

**On-slide points**

Suggested message:

> Patients Compass health education plans are now available through secure Shopify checkout.

- Link to pricing or plan selection.
- Keep it short on mobile.
- Avoid diagnosis or treatment claims.
- Preview before publishing.

**Speaker script**

The announcement bar should communicate availability without implying clinical care. Link it to the pricing or plan-selection destination. Check that it does not push navigation off-screen, obscure the logo, or become unreadable on a narrow viewport.

---

## Slide 13 — Final readiness checklist

**On-slide points**

- [ ] Connector returns both subscription-contract scopes.
- [ ] Monthly and Yearly selling plans exist.
- [ ] Family checkout behavior is explicitly defined.
- [ ] Subscription webhooks register without scope errors.
- [ ] Orders-paid webhook receives a signed test event.
- [ ] Logo, colors, and announcement bar preview correctly.
- [ ] No real payment has been submitted during validation.

**Speaker script**

The integration is ready for production review only after permissions, selling plans, webhooks, and theme branding have all been verified independently. The most important distinction is between a successful cart creation and a successful paid subscription. A cart proves Storefront connectivity; it does not prove recurring billing, payment capture, webhook delivery, or account synchronization.

---

## Official references

- [Shopify: Build a subscription contract](https://shopify.dev/docs/apps/build/purchase-options/subscriptions/contracts/build-a-subscription-contract)
- [Shopify: WebhookSubscriptionTopic reference](https://shopify.dev/docs/api/admin-graphql/latest/enums/WebhookSubscriptionTopic)
- [Shopify: currentAppInstallation query](https://shopify.dev/docs/api/admin-graphql/2026-10/queries/currentAppInstallation)
