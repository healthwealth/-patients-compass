# Patients Compass Digital Products — Shopify Setup

This guide assumes the six products discussed for the Patients Compass store:

- Start Here Health Organization Workbook — `$7.00`
- Doctor Visit Preparation Workbook — `$12.00`
- Lab Results Conversation Guide — `$15.00`
- Clinical Conversation Toolkit — `$29.00`
- Patients Compass Starter Bundle — `$39.00`
- Healthy Habits for Super Kids Activity Pack — `$0.00`

The mutations create one-time, non-shipping digital products. They do not create subscription selling plans.

## 1. Product creation mutation

Shopify's current Admin GraphQL API creates the product first and then manages the initial variant price with a variant mutation. Use the returned product ID and default variant ID from each response.

```graphql
mutation CreatePatientsCompassDigitalProduct($product: ProductCreateInput!) {
  productCreate(product: $product) {
    product {
      id
      title
      handle
      status
      variants(first: 5) {
        nodes {
          id
          title
          price
          inventoryItem { id requiresShipping tracked }
        }
      }
    }
    shop { id }
    userErrors { field message }
  }
}
```

Example variables for the first product:

```json
{
  "product": {
    "title": "Start Here Health Organization Workbook",
    "handle": "start-here-health-organization-workbook",
    "descriptionHtml": "<p>A practical workbook for organizing symptoms, questions, medications, and health goals before a care conversation.</p><p><em>Educational support only. This product does not diagnose or treat medical conditions.</em></p>",
    "vendor": "The Patient's Compass",
    "productType": "Digital Health Education",
    "tags": ["digital-product", "workbook", "patients-compass", "one-time"],
    "status": "ACTIVE",
    "seo": {
      "title": "Start Here Health Organization Workbook | Patients Compass",
      "description": "A practical digital workbook for organizing health questions and preparing for a care conversation."
    }
  }
}
```

## 2. Set price and disable shipping

After `productCreate`, use its returned default variant ID:

```graphql
mutation ConfigureDigitalVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants {
      id
      price
      inventoryItem {
        id
        requiresShipping
        tracked
      }
    }
    userErrors { field message }
  }
}
```

Variables for the `$7.00` workbook:

```json
{
  "productId": "gid://shopify/Product/REPLACE_PRODUCT_ID",
  "variants": [
    {
      "id": "gid://shopify/ProductVariant/REPLACE_VARIANT_ID",
      "price": "7.00",
      "inventoryItem": {
        "requiresShipping": false,
        "tracked": false
      }
    }
  ]
}
```

Repeat the same mutation with these prices:

```json
{
  "doctor-visit-preparation-workbook": "12.00",
  "lab-results-conversation-guide": "15.00",
  "clinical-conversation-toolkit": "29.00",
  "patients-compass-starter-bundle": "39.00",
  "healthy-habits-for-super-kids-activity-pack": "0.00"
}
```

`requiresShipping: false` marks the variant as non-physical. Digital Products app assets are still required for download delivery.

## 3. Publish to the Online Store channel

`productCreate` does not automatically publish the new product to every sales channel. First find the Online Store publication ID:

```graphql
query OnlineStorePublication {
  publications(first: 25) {
    nodes {
      id
      name
    }
  }
}
```

Then publish each product:

```graphql
mutation PublishPatientsCompassProduct($id: ID!, $publicationId: ID!) {
  publishablePublish(
    id: $id
    input: [{ publicationId: $publicationId }]
  ) {
    publishable { id }
    shop { id }
    userErrors { field message }
  }
}
```

Only publish after the product has a real PDF, workbook, or bundle asset configured in the Digital Products app. A product without an asset should remain `DRAFT` or unpublished.

## 4. One-shot Node.js Admin API template

Use a server-side Admin token only. Never place the token in browser code.

```js
const endpoint = 'https://s064cx-hu.myshopify.com/admin/api/2026-10/graphql.json';
const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

async function adminGraphQL(query, variables) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) throw new Error(JSON.stringify(body));
  return body.data;
}

const products = [
  {
    title: 'Start Here Health Organization Workbook',
    handle: 'start-here-health-organization-workbook',
    price: '7.00',
    descriptionHtml: '<p>Organize symptoms, questions, medications, and health goals before a care conversation.</p><p><em>Educational support only.</em></p>',
  },
  {
    title: 'Doctor Visit Preparation Workbook',
    handle: 'doctor-visit-preparation-workbook',
    price: '12.00',
    descriptionHtml: '<p>A structured workbook for appointment notes, questions, and follow-up planning.</p><p><em>Educational support only.</em></p>',
  },
  {
    title: 'Lab Results Conversation Guide',
    handle: 'lab-results-conversation-guide',
    price: '15.00',
    descriptionHtml: '<p>A plain-language guide for preparing questions about lab results.</p><p><em>Educational support only. Not diagnosis or treatment.</em></p>',
  },
  {
    title: 'Clinical Conversation Toolkit',
    handle: 'clinical-conversation-toolkit',
    price: '29.00',
    descriptionHtml: '<p>A bundle of doctor preparation, lab questions, symptom tracking, and follow-up planning tools.</p><p><em>Educational support only.</em></p>',
  },
  {
    title: 'Patients Compass Starter Bundle',
    handle: 'patients-compass-starter-bundle',
    price: '39.00',
    descriptionHtml: '<p>A starter bundle combining the core Patients Compass education workbooks.</p><p><em>Educational support only.</em></p>',
  },
  {
    title: 'Healthy Habits for Super Kids Activity Pack',
    handle: 'healthy-habits-for-super-kids-activity-pack',
    price: '0.00',
    descriptionHtml: '<p>A free 19-page activity pack for families.</p><p><em>Educational resource only.</em></p>',
  },
];

const createMutation = `mutation($product: ProductCreateInput!) {
  productCreate(product: $product) {
    product { id title handle variants(first: 1) { nodes { id } } }
    userErrors { field message }
  }
}`;

const variantMutation = `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
  productVariantsBulkUpdate(productId: $productId, variants: $variants) {
    productVariants { id price inventoryItem { id requiresShipping tracked } }
    userErrors { field message }
  }
}`;

for (const item of products) {
  const created = await adminGraphQL(createMutation, {
    product: {
      title: item.title,
      handle: item.handle,
      descriptionHtml: item.descriptionHtml,
      vendor: "The Patient's Compass",
      productType: 'Digital Health Education',
      tags: ['digital-product', 'patients-compass', 'one-time'],
      status: 'DRAFT',
    },
  });
  const result = created.productCreate;
  if (result.userErrors.length) throw new Error(JSON.stringify(result.userErrors));
  const product = result.product;
  const variantId = product.variants.nodes[0].id;
  const configured = await adminGraphQL(variantMutation, {
    productId: product.id,
    variants: [{
      id: variantId,
      price: item.price,
      inventoryItem: { requiresShipping: false, tracked: false },
    }],
  });
  const errors = configured.productVariantsBulkUpdate.userErrors;
  if (errors.length) throw new Error(JSON.stringify(errors));
  console.log(JSON.stringify({ title: item.title, productId: product.id, variantId, price: item.price }));
}
```

The template intentionally creates products as `DRAFT`. After assets are attached and tested, publish them with the `publishablePublish` mutation or Shopify Admin.

## 5. Editorial digital-product card section

Create `sections/patients-compass-digital-products.liquid` in the draft Shopify theme:

```liquid
<section class="pc-digital-products page-width" data-section-id="{{ section.id }}">
  <div class="pc-digital-heading">
    <p class="pc-eyebrow">Learn at your own pace</p>
    <h2>{{ section.settings.heading | escape }}</h2>
    <p>{{ section.settings.intro | escape }}</p>
  </div>

  <div class="pc-digital-grid">
    {% for block in section.blocks %}
      <article class="pc-digital-card" {{ block.shopify_attributes }}>
        {% if block.settings.eyebrow != blank %}<p class="pc-digital-kicker">{{ block.settings.eyebrow | escape }}</p>{% endif %}
        <h3>{{ block.settings.title | escape }}</h3>
        <p class="pc-digital-description">{{ block.settings.description | escape }}</p>
        <div class="pc-digital-meta">
          <span class="pc-digital-price">{{ block.settings.price | escape }}</span>
          <span class="pc-digital-format">{{ block.settings.format | escape }}</span>
        </div>
        {% if block.settings.url != blank %}
          <a class="pc-digital-button" href="{{ block.settings.url }}">{{ block.settings.cta_label | escape }} <span aria-hidden="true">→</span></a>
        {% endif %}
      </article>
    {% endfor %}
  </div>
</section>

<style>
  .pc-digital-products { padding: 84px 0; background: #F8F5EF; color: #2D2926; }
  .pc-digital-heading { max-width: 720px; margin: 0 auto 36px; text-align: center; }
  .pc-eyebrow, .pc-digital-kicker { color: #769889; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .pc-digital-heading h2 { margin: 10px 0 14px; color: #134E4A; font-family: Georgia, serif; font-size: clamp(34px, 4vw, 52px); line-height: 1.08; }
  .pc-digital-heading > p:last-child { margin: 0; color: #6D716C; font-size: 17px; line-height: 1.6; }
  .pc-digital-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
  .pc-digital-card { display: flex; min-height: 320px; flex-direction: column; padding: 28px; border: 1px solid #D3D0C9; border-radius: 20px; background: #FFFFFF; }
  .pc-digital-card:hover { border-color: #769889; }
  .pc-digital-kicker { margin: 0 0 12px; }
  .pc-digital-card h3 { margin: 0 0 14px; color: #2D2926; font-family: Georgia, serif; font-size: 27px; line-height: 1.15; }
  .pc-digital-description { min-height: 72px; margin: 0; color: #6D716C; font-size: 15px; line-height: 1.55; }
  .pc-digital-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 24px 0; }
  .pc-digital-price { color: #134E4A; font-size: 28px; font-weight: 700; }
  .pc-digital-format { color: #6D716C; font-size: 13px; }
  .pc-digital-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 46px; margin-top: auto; border-radius: 999px; background: #769889; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; }
  .pc-digital-button:hover { background: #134E4A; }
  @media screen and (max-width: 900px) { .pc-digital-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media screen and (max-width: 600px) { .pc-digital-products { padding: 56px 20px; } .pc-digital-grid { grid-template-columns: 1fr; } }
</style>

{% schema %}
{
  "name": "Patients Compass digital products",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "Practical tools for clearer conversations" },
    { "type": "textarea", "id": "intro", "label": "Intro", "default": "Downloadable education resources to help you organize questions, prepare for appointments, and learn at your own pace." }
  ],
  "blocks": [
    {
      "type": "product",
      "name": "Digital product",
      "settings": [
        { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "Digital workbook" },
        { "type": "text", "id": "title", "label": "Title", "default": "Doctor Visit Preparation Workbook" },
        { "type": "textarea", "id": "description", "label": "Description", "default": "A structured workbook for better questions and follow-up notes." },
        { "type": "text", "id": "price", "label": "Price", "default": "$12" },
        { "type": "text", "id": "format", "label": "Format", "default": "Fillable PDF" },
        { "type": "text", "id": "cta_label", "label": "Button label", "default": "View resource" },
        { "type": "url", "id": "url", "label": "Product URL" }
      ]
    }
  ],
  "presets": [
    {
      "name": "Patients Compass digital products",
      "blocks": [
        { "type": "product", "settings": { "title": "Start Here Health Organization Workbook", "price": "$7", "format": "Fillable PDF" } },
        { "type": "product", "settings": { "title": "Doctor Visit Preparation Workbook", "price": "$12", "format": "Fillable PDF" } },
        { "type": "product", "settings": { "title": "Lab Results Conversation Guide", "price": "$15", "format": "PDF guide" } }
      ]
    }
  ]
}
{% endschema %}
```

## 6. Configure automatic fulfillment and email delivery

The core product mutations above do not upload files or configure the Digital Products app's delivery emails. Shopify's supported setup is:

1. Shopify Admin → **Settings → Apps** → install **Digital Products**.
2. Open **Apps → Digital Products**.
3. Add the PDF, ZIP, or supported hosted link to each product's variant.
4. Open the variant's delivery settings.
5. Set **Delivery method: Send automatically**.
6. Leave the access limit at Unlimited, or choose a documented per-customer limit.
7. Save the asset configuration.
8. In **Digital Products → Settings → Digital products via email**, customize:
   - Digital product ready email
   - Digital product update email
9. Use a subject such as:

   ```text
   Your Patients Compass digital resource is ready
   ```

10. Use body copy such as:

   ```liquid
   Hi {{customer.first_name}},

   Your Patients Compass digital resource is ready to download.

   Open the secure download link below. Please keep this email for future access.

   Thank you,
   The Patient's Compass
   {{shop.url}}
   ```

11. In **Digital Products → Settings → Digital products at checkout**, add the Digital Products block to the **Thank you** and **Order status** pages.
12. Place a test order using a test payment method, then verify:
    - The order is paid.
    - The digital item is marked fulfilled automatically.
    - The customer receives the ready email.
    - The download appears on the Thank you page if the checkout block is enabled.
    - The download link works on desktop and mobile.

Shopify documents that automatically delivered digital products are emailed after successful payment and that non-shipping items are marked fulfilled. The app also owns the asset upload, access-limit, delivery-method, and email-template settings. [1] [2]

## Sources

[1]: https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate "Shopify productCreate mutation"
[2]: https://help.shopify.com/en/manual/products/digital-service-product/digital-downloads "Shopify Digital Products app and download fulfillment"
[3]: https://shopify.dev/docs/api/admin-graphql/latest/input-objects/ProductCreateInput "Shopify ProductCreateInput"
[4]: https://shopify.dev/docs/api/admin-graphql/latest/input-objects/ProductVariantsBulkInput "Shopify ProductVariantsBulkInput"
[5]: https://shopify.dev/docs/api/admin-graphql/latest/input-objects/InventoryItemInput "Shopify InventoryItemInput"
