# Patients Compass Shopify Store Setup, Collections, Navigation, and Testing

## Slide 1 — Launch status

Patients Compass is connected to the Shopify store `s064cx-hu.myshopify.com`, with the customer-facing primary domain `patientcompashealth.myshopify.com`. The application uses Shopify Storefront cart creation for checkout preparation. The theme remains unpublished while the final navigation and payment checks are completed.

## Slide 2 — Catalog structure

The store contains the Patients Compass subscription products, Family Plan, digital resources, and the Healthy Habits for Super Kids Activity Pack. Existing products were preserved rather than duplicated.

The Super Kids product is active, free, and has one variant: `gid://shopify/ProductVariant/50665766813861`. Because it is a digital product with zero physical inventory, its inventory policy was changed to `CONTINUE` so a zero-inventory state does not prevent checkout.

## Slide 3 — Automated collections

Three automated collections were created and published to the Online Store channel:

- Patients Compass Plans — `gid://shopify/Collection/491697438885`
- Digital Resources — `gid://shopify/Collection/491697471653`
- Super Kids — `gid://shopify/Collection/491697504421`

The Super Kids product was also published to the Online Store, Manus, and Buy Button publications so it can be used by the storefront and website checkout integrations.

## Slide 4 — Shop navigation

The intended navigation change is a top-level **Shop** item linking to `/collections/all`, which displays all products. The uploaded theme header reads from Shopify’s `main-menu` setting, so the final configuration is:

1. Shopify Admin → **Online Store → Navigation** or **Content → Menus**.
2. Open **Main menu**.
3. Add a menu item titled **Shop**.
4. Set the link to **Collections → All products**, or use `/collections/all`.
5. Save the menu.
6. Shopify Admin → Online Store → Themes → Customize.
7. Open the Patients Compass header and confirm **Main menu** is selected.
8. Verify the Shop item appears in both desktop navigation and the mobile menu.

The connected app currently lacks `read_online_store_navigation` and `write_online_store_navigation`, so the Shopify MCP cannot edit this menu by API yet. The app owner must add those two scopes, release the app version, and reauthorize the store. Until then, the Shopify Admin menu editor is the safe manual route.

## Slide 5 — Checkout test result

The Storefront API successfully created a non-payment cart for the free Super Kids product. This confirms that the product variant, Storefront token, product publication, and inventory policy are now compatible with cart creation.

No order was created and no payment was submitted. A raw HTTP request to the checkout URL returned `403 Request Forbidden`. Opening the same checkout URL in a real browser reached the Shopify Checkout page, but the page remained on its loading skeleton rather than rendering the contact and payment form. This is a checkout-page protection or hydration issue, not a Storefront cart-creation failure.

## Slide 6 — How to resolve the checkout 403

Use these checks in order:

1. Open the checkout URL in a normal browser window, not a raw server-side request. Shopify checkout can reject automated HTTP clients while still allowing browser navigation.
2. Start a fresh cart and do not reuse an old checkout URL. Checkout sessions can expire.
3. Test in a private/incognito window with ad blockers, VPN extensions, and privacy extensions disabled. Shopify identifies browser extensions and network interference as common causes of checkout loading or payment loops.
4. Verify that the store is not still password-protected and that the store has a paid plan or an eligible development-store checkout configuration.
5. In Shopify Admin → **Settings → Payments**, confirm that at least one supported payment provider or test gateway is active.
6. Check Shopify Admin → **Orders → Abandoned checkouts** for the checkout timeline. A failed payment normally creates an abandoned checkout rather than an order.
7. Check the Shopify status page and retry from both desktop and mobile browsers.
8. If the browser still displays `Request Forbidden`, provide Shopify Support with the exact error, timestamp, browser/device, store domain, and a fresh reproducible checkout URL.

## Slide 7 — Manual Bogus Gateway test

Shopify’s current documentation calls this **Test payment gateway**. It is the appropriate Bogus Gateway-style test for a non-production payment check.

Before testing, confirm that the store is not receiving live traffic that must continue accepting card payments. Test mode disables normal live card checkout while it is active. Shopify also requires a paid plan for gateway-based test orders, and the test purchase amount must be greater than the equivalent of 1 USD. A free `$0.00` digital product cannot be used to validate a gateway transaction, so use a temporary paid digital product or a paid plan product for the payment test.

To activate the test gateway:

1. Shopify Admin → **Settings → Payments**.
2. Deactivate the active credit-card provider if Shopify requires it.
3. Click **See all other providers** or **Choose a provider**.
4. Select **Test payment gateway**.
5. Activate it and save.
6. Open a fresh paid checkout in an incognito browser.
7. Enter the customer information and shipping details only if the product requires them.
8. For an approved transaction, use:
   - Name: `Test payment gateway`
   - Card number: `1`
   - Expiry: any future date
   - CVV: any three digits
9. Submit the order and confirm an order appears in Shopify Admin.
10. Verify the order timeline, confirmation email, `orders/paid` webhook processing, and Patients Compass subscription or purchase mapping.
11. Deactivate the test gateway immediately after testing so real customers are not blocked from paying.

The test gateway can also simulate a decline with card number `2` and a gateway failure with card number `3`. Shopify’s Test payment gateway is not compatible with subscription products. For subscription testing, use Shopify Payments test mode instead.

## Slide 8 — Shopify Payments test mode alternative

If Shopify Payments is fully activated and the store is eligible, use Settings → Payments → Shopify Payments → Manage → Enable test mode. Shopify documents `4242424242424242` as a successful test card, with a future expiry and a three-digit security code. Test mode must be disabled immediately after the test. Do not fulfill test orders or purchase shipping labels for them.

## Slide 9 — Validation gate before publishing

The theme should not be published until all of the following are true:

- The Shop link appears in the desktop and mobile menus.
- The three automated collections open correctly.
- The Super Kids product is visible through the intended sales channel.
- A fresh checkout URL renders the full checkout form in a normal browser.
- One paid test order succeeds through Test payment gateway or Shopify Payments test mode.
- The Shopify `orders/paid` webhook reaches the Patients Compass endpoint and is processed idempotently.
- The test order is not fulfilled, and test mode is disabled afterward.
- The Family plan card points to the Family product rather than the Yearly product.

## Slide 10 — References

[1]: https://help.shopify.com/en/manual/checkout-settings/test-orders "Shopify: Placing a test order"

[2]: https://help.shopify.com/en/manual/checkout-settings/test-orders/payments-test-mode "Shopify: Activating a payment gateway in test mode"

[3]: https://help.shopify.com/en/manual/payments/shopify-payments/testing-shopify-payments "Shopify: Testing Shopify Payments"

[4]: https://help.shopify.com/en/manual/checkout-settings/troubleshooting-checkout-payments "Shopify: Troubleshooting checkout payment issues"

[5]: https://shopify.dev/docs/api/admin-graphql/2026-10/mutations/menuUpdate "Shopify Admin GraphQL: menuUpdate"

[6]: https://shopify.dev/docs/api/admin-graphql/2026-10/objects/Menu "Shopify Admin GraphQL: Menu object"
