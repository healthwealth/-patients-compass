# Shopify Digital Resources and Fulfillment research

Verified 2026-10-16.

## Sources

- https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema
- https://help.shopify.com/en/manual/products/digital-service-product/digital-downloads
- https://help.shopify.com/en/manual/products/digital-service-product/selling-services-or-digital-products
- https://apps.shopify.com/digital-downloads

## Findings

- A Shopify section uses one `{% schema %}` tag containing valid JSON. Section settings, blocks, presets, and product picker settings are declared in the schema.
- Blocks are rendered with `section.blocks`; each block should include `{{ block.shopify_attributes }}` so the Theme Editor can identify it.
- Shopify Digital Products supports files and supported-provider links on existing products. A variant can have multiple assets, with up to 50 files and a combined 5 GB limit according to the Help Center page.
- The Digital Products app defaults digital assets to automatic delivery with unlimited access. The merchant can change access limits and delivery method per variant.
- With `Send automatically`, after successful payment Shopify emails the customer an asset link and non-shippable items are marked fulfilled. `Send manually` requires fulfillment before the email is sent.
- Shopify’s digital-product guidance says a digital download app is required for download links; the free Shopify Digital Products app is one option, and third-party apps are alternatives.
- Digital-only products should have the Physical product / Requires shipping setting disabled.
- Shopify recommends placing a test order after configuring a digital product.
