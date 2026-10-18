# Patients Compass Digital Products — Customer Downloads and Presentation Script

## Customer-account download page

### Important Shopify limitation

The Shopify **Digital Products** app owns the secure download URLs. A normal Liquid template should not invent or expose permanent file URLs. The safest Liquid pattern is to show a customer's paid digital orders and link each order to its Shopify order-status page, where the Digital Products block can display the secure download link.

For stores using Shopify's **new customer accounts**, legacy `customers/account.liquid` templates are not used. Use the app's customer-account extension if the Digital Products app provides one, or rely on the email and order-status download flow. The section below is for legacy Liquid customer accounts and is also useful as a branded fallback.

### `sections/patients-compass-downloads.liquid`

```liquid
{% if customer %}
  <section class="pc-downloads page-width">
    <div class="pc-downloads-heading">
      <p class="pc-eyebrow">Your Patients Compass library</p>
      <h1>Purchased digital resources</h1>
      <p>Open an order to access its secure download link. If you do not see a link, check the delivery email or contact support.</p>
    </div>

    {% paginate customer.orders by 10 %}
      {% assign digital_order_count = 0 %}
      <div class="pc-download-list">
        {% for order in customer.orders %}
          {% assign digital_order_count = digital_order_count | plus: 1 %}
          <article class="pc-download-order">
            <div>
              <p class="pc-download-kicker">Order {{ order.name }}</p>
              <h2>{{ order.created_at | date: '%B %-d, %Y' }}</h2>
              <ul class="pc-download-items">
                {% for line_item in order.line_items %}
                  <li>{{ line_item.title | escape }}{% if line_item.quantity > 1 %} × {{ line_item.quantity }}{% endif %}</li>
                {% endfor %}
              </ul>
            </div>
            <div class="pc-download-actions">
              <span class="pc-download-status">{{ order.financial_status_label | escape }}</span>
              {% if order.order_status_url != blank %}
                <a class="pc-download-button" href="{{ order.order_status_url }}">Open downloads <span aria-hidden="true">→</span></a>
              {% else %}
                <a class="pc-download-button" href="{{ routes.account_url }}">View order <span aria-hidden="true">→</span></a>
              {% endif %}
            </div>
          </article>
        {% endfor %}
      </div>

      {% if digital_order_count == 0 %}
        <div class="pc-download-empty">
          <h2>No purchased resources yet</h2>
          <p>Explore the Patients Compass education library to find a practical workbook or guide.</p>
          <a class="pc-download-button" href="/collections/digital-products">Explore resources</a>
        </div>
      {% endif %}

      {% if paginate.pages > 1 %}
        <nav class="pc-download-pagination" aria-label="Purchase history pages">
          {% if paginate.previous %}<a href="{{ paginate.previous.url }}">Previous</a>{% endif %}
          <span>Page {{ paginate.current_page }} of {{ paginate.pages }}</span>
          {% if paginate.next %}<a href="{{ paginate.next.url }}">Next</a>{% endif %}
        </nav>
      {% endif %}
    {% endpaginate %}
  </section>
{% else %}
  <section class="pc-downloads page-width">
    <div class="pc-download-empty">
      <h1>Sign in to view your resources</h1>
      <a class="pc-download-button" href="{{ routes.account_login_url }}">Sign in</a>
    </div>
  </section>
{% endif %}

<style>
  .pc-downloads { padding: 72px 0; background: #F8F5EF; color: #2D2926; }
  .pc-downloads-heading { max-width: 720px; margin: 0 auto 36px; text-align: center; }
  .pc-eyebrow, .pc-download-kicker { color: #769889; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .pc-downloads h1 { margin: 10px 0 14px; color: #134E4A; font-family: Georgia, serif; font-size: clamp(34px, 4vw, 52px); line-height: 1.08; }
  .pc-downloads-heading > p:last-child { margin: 0; color: #6D716C; font-size: 17px; line-height: 1.6; }
  .pc-download-list { display: grid; gap: 16px; max-width: 900px; margin: 0 auto; }
  .pc-download-order { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 24px; border: 1px solid #D3D0C9; border-radius: 18px; background: #FFFFFF; }
  .pc-download-kicker { margin: 0 0 8px; }
  .pc-download-order h2 { margin: 0 0 12px; color: #2D2926; font-family: Georgia, serif; font-size: 24px; }
  .pc-download-items { margin: 0; padding-left: 20px; color: #6D716C; font-size: 15px; line-height: 1.55; }
  .pc-download-actions { display: flex; flex-shrink: 0; align-items: center; gap: 14px; }
  .pc-download-status { color: #769889; font-size: 12px; font-weight: 700; text-transform: capitalize; }
  .pc-download-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 12px 18px; border-radius: 999px; background: #769889; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; }
  .pc-download-button:hover { background: #134E4A; }
  .pc-download-empty { max-width: 640px; margin: 0 auto; padding: 40px; border: 1px solid #D3D0C9; border-radius: 18px; background: #FFFFFF; text-align: center; }
  .pc-download-empty p { margin: 0 0 24px; color: #6D716C; }
  .pc-download-pagination { display: flex; justify-content: center; gap: 20px; margin-top: 28px; color: #6D716C; font-size: 14px; }
  .pc-download-pagination a { color: #134E4A; font-weight: 700; text-decoration: none; }
  @media screen and (max-width: 650px) { .pc-downloads { padding: 52px 20px; } .pc-download-order { align-items: flex-start; flex-direction: column; } .pc-download-actions { width: 100%; align-items: flex-start; flex-direction: column; } .pc-download-button { width: 100%; } }
</style>

{% schema %}
{
  "name": "Patients Compass downloads",
  "settings": [],
  "presets": [
    { "name": "Patients Compass downloads" }
  ]
}
{% endschema %}
```

### Install the section

For legacy customer accounts:

1. Shopify Admin → **Online Store → Themes → Edit code**.
2. Create `sections/patients-compass-downloads.liquid`.
3. Paste the section above.
4. Open the customer account template or account page in the Theme Editor.
5. Add the section.
6. In **Apps → Digital Products → Settings**, add the Digital Products block to the **Thank you** and **Order status** pages.
7. Test with a paid test order and click **Open downloads** from the account page.

For new customer accounts, use the app's supported customer-account extension if available. Otherwise, the secure re-download route is the Digital Products email plus the Shopify order-status page.

---

# Presentation script: Patients Compass digital products and fulfillment

## Slide 1 — The catalog expands the ecosystem

**On-slide message**

Practical digital tools for clearer health conversations.

**Speaker script**

Patients Compass can offer focused, one-time education resources alongside the existing Monthly, Yearly, and Family plans. These products give visitors a lower-commitment entry point while extending the same educational mission.

## Slide 2 — The recommended catalog

**On-slide message**

- Start Here Health Organization Workbook — $7
- Doctor Visit Preparation Workbook — $12
- Lab Results Conversation Guide — $15
- Clinical Conversation Toolkit — $29
- Patients Compass Starter Bundle — $39
- Healthy Habits for Super Kids Activity Pack — Free

**Speaker script**

The catalog begins with accessible single workbooks, then moves into a higher-value toolkit and bundle. The free Super Kids Activity Pack remains a public resource and lead magnet rather than a paid product.

## Slide 3 — One-time product architecture

**On-slide message**

Product → Variant → Price → Digital asset → Secure delivery

**Speaker script**

The Admin API creates the product and its initial variant. A follow-up variant mutation sets the price and marks the inventory item as non-shipping. The actual PDF, ZIP, or supported hosted link is attached through Shopify Digital Products.

## Slide 4 — The automation script

**On-slide message**

- Dry-run by default
- Duplicate-handle protection
- Creates products as DRAFT
- Configures price and `requiresShipping: false`
- Optional publish step

**Speaker script**

The Node.js script is intentionally conservative. It defaults to a dry run, skips existing handles, creates draft products, and only publishes when the operator explicitly supplies the publish flag. This prevents a product from appearing for sale before its digital asset is ready.

## Slide 5 — Digital Products app fulfillment

**On-slide message**

1. Install Digital Products.
2. Attach each file to its variant.
3. Set Send automatically.
4. Choose access limits.
5. Customize the ready email.

**Speaker script**

Shopify's Digital Products app owns the secure download asset and email-delivery lifecycle. A product is not ready for customers just because the catalog record exists. Each variant needs its actual asset and automatic delivery setting.

## Slide 6 — Customer re-download experience

**On-slide message**

Account page → Order status page → Secure download link

**Speaker script**

The branded account section lists a customer's purchased orders and sends them to the Shopify order-status page. That page is where the Digital Products block can provide the secure link. The Liquid theme should never expose a permanent storage URL or invent a download token.

## Slide 7 — Email and checkout experience

**On-slide message**

- Digital product ready email
- Digital product update email
- Thank you page block
- Order status page block

**Speaker script**

After payment, Shopify can email the customer that the resource is ready. The same secure download can be surfaced on the Thank you page and Order status page when the Digital Products block is enabled. Customers have both an inbox route and an account/order route.

## Slide 8 — Test plan

**On-slide message**

- Test payment only
- Desktop and mobile download
- Paid order is fulfilled
- Email arrives
- Account link opens order status
- Asset cannot be accessed without purchase

**Speaker script**

The final test uses a Shopify test payment. We verify fulfillment, email delivery, mobile download behavior, order-status access, and the absence of an unauthenticated public file URL. We do not use real customer health information in testing.

## Slide 9 — Publish gate

**On-slide message**

Do not publish until:

- Assets are attached
- Prices are verified
- Email templates are reviewed
- Download links work
- Product pages use the Patients Compass design

**Speaker script**

The catalog is ready for production only after the assets, prices, email copy, and download flow have been tested together. The result should feel like a natural extension of Patients Compass, not a separate digital-download marketplace.
