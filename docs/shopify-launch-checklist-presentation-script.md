# Patients Compass Shopify Launch — Presentation Script

## Slide 1 — Launch decision

**On-slide message**

Do not publish until the Family card and product catalog structure are verified.

**Speaker script**

The current draft is visually close to the Patients Compass direction, but it is not ready to publish. The mobile preview shows the third card labeled Family while displaying the Yearly product. That is a commerce accuracy issue, not merely a visual issue. We will correct the product assignment, configure the catalog so current and future products can be discovered, and then run a draft-first quality gate.

---

## Slide 2 — Correct plan-card structure

**On-slide message**

1. Monthly Pro
2. Yearly Pro — Best value
3. Family Plan

**Speaker script**

The homepage plan hierarchy remains simple: Monthly, Yearly, and Family. Each card must use a Shopify product picker or product object, not a manually typed title or hard-coded price. The card title, price, image, description, and product link must all come from the same selected product. This prevents the exact error visible in the current screenshot, where the Family label is paired with Yearly product data.

---

## Slide 3 — Family Plan correction

**On-slide message**

Theme Editor → Home page → Plans → Card 3 → Product picker → Family Plan → Save

**Speaker script**

Open the unpublished theme in Shopify Theme Editor and select the Home page. Open the Plans section and then the third card. In its Product field, remove the Yearly product and choose the exact Family Plan product from Shopify’s product picker. Do not type a numeric ID into a text field. After saving, confirm that the card shows the Family title, Family price, Family description, and Family product URL.

The known plan mapping is Monthly product `gid://shopify/Product/10818193850533`, Yearly product `gid://shopify/Product/10818195357861`, and Family product `gid://shopify/Product/10821029560485`. These identifiers should be rechecked against the live catalog before any final write.

---

## Slide 4 — Catalog architecture

**On-slide message**

- Patients Compass Plans
- Digital Resources
- Super Kids
- Shop All

**Speaker script**

The storefront should separate recurring plans from downloadable educational products. Patients Compass Plans contains Monthly, Yearly, and Family. Digital Resources contains the five active adult resources. Super Kids remains a separate family-oriented resource area. Shop All is the broad discovery path for every product published to the Online Store channel.

This structure keeps the homepage curated while ensuring the store can grow without redesigning the theme every time a product is added.

---

## Slide 5 — Automated Digital Resources collection

**On-slide message**

Collection type: Automated / Smart collection

Example rule:

```text
Product type is Digital Download
```

**Speaker script**

Create an automated collection named Digital Resources. Use a consistent product type such as Digital Download for downloadable workbooks, guides, toolkits, and bundles. Any future product created with that product type will be included automatically, subject to Shopify’s product status and sales-channel availability rules.

Shopify’s current collection documentation calls these smart collections in the legacy model. They can use selection conditions and can require all conditions or any condition, depending on the collection configuration. If the store has Shopify’s newer collection model, use its equivalent automated-condition workflow.

---

## Slide 6 — Current digital catalog mapping

**On-slide message**

Digital Resources:

- Start Here Health Organization Workbook
- Doctor Visit Preparation Workbook
- Lab Results Conversation Guide
- Clinical Conversation Toolkit
- Patients Compass Starter Bundle

**Speaker script**

The active digital products should be mapped by stable Shopify product identity and exact title. The recommended order is Start Here, Doctor Visit Preparation, Lab Results Conversation Guide, Clinical Conversation Toolkit, and Starter Bundle. Each product should have an image, a clear educational description, an intentional price, and the correct digital file attached.

Do not create duplicates when these products already exist. Use the Theme Editor product picker or a collection-based section to reference the existing catalog.

---

## Slide 7 — Super Kids activation

**On-slide message**

Healthy Habits for Super Kids Activity Pack

Draft → verify file → Active → Online Store

**Speaker script**

Healthy Habits for Super Kids remains separate from the adult resource grid. Before activating it, confirm the 19-page PDF is attached in the Digital Products app, the product is non-shipping, the price is intentional, and the description includes the educational-use disclaimer. Then change the product from Draft to Active and ensure Online Store is selected as a sales channel.

The product should be tested publicly without submitting a real payment. The download email and the product page must both work before the product is promoted in navigation.

---

## Slide 8 — Digital fulfillment

**On-slide message**

Digital Products app:

- File attached to the correct variant
- Send automatically
- Non-shipping product
- Test order completed

**Speaker script**

For the initial launch, Shopify’s Digital Products app is the simplest fulfillment path. Attach the file to the correct product variant, choose automatic delivery, and disable the physical-product setting for downloadable products. After a successful test order, the customer should receive an email with the download link, and the digital item should be fulfilled without shipping charges.

An external app is only necessary if Patients Compass later needs expiring links, licensing, advanced download analytics, customer libraries, or course-style access.

---

## Slide 9 — Theme Editor configuration

**On-slide message**

- Logo: The Patient’s Compass
- Portrait: Sonya / Health Companion
- Plans: product pickers
- Digital Resources: collection picker
- Super Kids: dedicated resource card

**Speaker script**

In Theme settings, upload the approved Patients Compass logo and select Sonya’s professional Health Companion portrait. In the Plans section, use product pickers for the three plans. In Digital Resources, prefer a collection picker so the section stays current as products are added. Keep Super Kids as its own section or dedicated card so parents can find it quickly without mixing it into the adult resources.

The Theme Editor should control content while Liquid provides the reusable layout and responsive behavior.

---

## Slide 10 — Future-product workflow

**On-slide message**

Create product → set type → attach file → activate → collection → storefront

**Speaker script**

The future workflow should be repeatable. Create the product, use the correct product type, add an image and educational description, attach the digital file, disable shipping when appropriate, activate the product, and publish it to Online Store. The automated collection then includes it according to its rules, and the collection-based theme section displays it without another Liquid edit.

Use consistent product types and tags. Avoid relying on inconsistent titles as the only automation rule.

---

## Slide 11 — Responsive and functional quality gate

**On-slide message**

Validate at 1440, 1280, 1024, 768, 390, and 375 pixels.

**Speaker script**

Before publishing, verify the plan cards and resource cards at desktop, tablet, and mobile widths. There must be no horizontal scrolling. The mobile header must collapse correctly. Buttons must remain touch-friendly and retain visible focus states. The Family card must remain Family at every breakpoint. Each product link must resolve to the intended Shopify product, and checkout testing must stop before payment submission.

Also verify meaningful image alt text, readable disclaimers, and correct loading behavior for below-the-fold product images.

---

## Slide 12 — Publish gate

**On-slide message**

Publish only after owner approval.

Checklist:

- Family card corrected
- Collections tested
- Digital files attached
- Product statuses intentional
- Mobile and desktop reviewed
- Test checkout completed without payment
- Owner approves draft

**Speaker script**

Publishing is the final step, not the implementation step. The current draft should remain unpublished until the Family mismatch is corrected and the automated collection behavior is demonstrated with a test product or verified catalog item. Once the product links, fulfillment, responsive layout, and educational boundaries are confirmed, the owner reviews the final draft and explicitly approves publication.

The launch outcome is a Shopify store that feels like Patients Compass, accurately represents every plan, supports the current digital catalog, and can grow with future products without repeated theme rebuilds.

## Launch references

- Shopify automated collections: https://help.shopify.com/en/manual/products/collections/automated-collections
- Shopify product details and organization: https://help.shopify.com/en/manual/products/details
- Shopify section schema: https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema
- Shopify Digital Products: https://help.shopify.com/en/manual/products/digital-service-product/digital-downloads
