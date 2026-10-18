# Image and Search-Preview Audit

## Initial Live-Site Findings

The live homepage preserves the established Patients Compass structure and clinical editorial style, but its hero visual currently relies on a subtle CSS treatment after a legacy image fallback hides an unavailable image URL. The visible result has ample whitespace but lacks a branded visual focal point that can carry into search and social previews.

The homepage still renders a remote CloudFront image for the Dr. Compass assistant. It should remain accessible, receive explicit dimensions and loading behavior, and retain a text alternative. Other image-like interfaces on the page are largely DOM-based cards and charts rather than responsive media assets.

The next audit step is to inspect the delivered head tags, canonical URL, Open Graph and Twitter metadata, structured data, all rendered image sources, and HTTP responses. The implementation should add a managed, branded social-preview image and preserve the current warm sage, cream, and editorial typography aesthetic.

## Confirmed Delivery Issues

The live head already declares canonical, Open Graph, Twitter, and JSON-LD metadata, but its shared `og:image` and `twitter:image` URL resolves to the site HTML rather than an image. This prevents reliable rich previews in social platforms and search surfaces.

The preload hint and three active visual URLs point to legacy CloudFront objects that return HTTP `403`. Those sources include the homepage wellness hero, compass-system image, and Dr. Compass assistant avatar. The client fallbacks avoid broken icons but leave the hero visually underpowered and the assistant without a stable portrait.

The next implementation will replace all four affected sources with managed assets, make the hero a responsive loaded image rather than a hidden fallback, provide explicit image dimensions and native lazy-loading where appropriate, align static and client-side metadata to the valid preview asset, and simplify stale preview references in structured data.

## Completed Optimization

The homepage now uses managed Patients Compass hero and compass-system images, while the Dr. Compass widget uses a managed assistant portrait. The hero is preloaded with high fetch priority, its decorative image has no redundant spoken alternative, and supporting images declare dimensions, asynchronous decoding, appropriate lazy loading, and non-disruptive fallback behavior.

Static and client-side metadata now use the same valid canonical host and managed social-preview image. Open Graph and Twitter tags include image descriptions, and the Organization, MedicalBusiness, WebSite, and MedicalWebPage structured data no longer point at missing `logo.png` or `og-card.png` paths.

Search engines and social platforms may retain prior preview imagery until their next crawl or cache refresh. The updated metadata and image URLs are present at deployment and ready for reprocessing.
