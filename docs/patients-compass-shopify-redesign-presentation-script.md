# Patients Compass Shopify Redesign — Presentation Script

## Slide 1 — The design problem

**On-slide message**

The current Helio storefront is generic. The Patients Compass website has a distinct clinical-editorial identity that should carry into Shopify.

**Speaker script**

The Shopify storefront should not look like a separate generic shop. It should feel like the commerce layer of the Patients Compass ecosystem. The redesign keeps the same warm editorial tone, professional Health Companion visual language, clinical-laboratory credibility, and resource-led navigation that visitors already recognize on the main website.

---

## Slide 2 — Design target

**On-slide message**

- Warm ivory canvas
- Sage credibility bar
- Editorial serif headline
- Coral emphasis
- Teal action buttons
- Professional Health Companion card

**Speaker script**

The target is a calm clinical editorial system. Warm ivory replaces sterile white. Sage establishes trust. Deep text preserves readability. Teal carries actions. Coral is reserved for important editorial emphasis, such as the phrase “structured doctor conversation.” The result should feel considered, human, and evidence-aware rather than like a default Shopify catalog.

---

## Slide 3 — Branded header

**On-slide message**

- Clinical Laboratory Scientist credibility bar
- Patients Compass Ecosystem wordmark
- Ecosystem navigation
- Resources and Pricing emphasis
- Search, Sign Up, and Sign In
- Super Kid Activity Pack access

**Speaker script**

The header is a major brand signal. It begins with the credibility message, then presents the Patients Compass wordmark and ecosystem navigation. Pricing remains visible but should not overwhelm the educational navigation. The Super Kid Activity Pack remains discoverable as a practical resource.

---

## Slide 4 — Hero composition

**On-slide message**

> Turn confusing lab results into a structured doctor conversation.

- Primary: Take the Start Here Quiz
- Secondary: Try AI Lab Scanner
- Health Companion visual card
- Educational-only boundary

**Speaker script**

The hero leads with a clear transformation: helping people move from confusing information to a structured doctor conversation. It does not promise diagnosis or treatment. The two calls to action guide visitors either into the educational journey or toward the AI Lab Scanner. The Health Companion card adds a human face and shows that the product is a guided education system, not just a checkout page.

---

## Slide 5 — Commerce without losing trust

**On-slide message**

- Monthly Pro
- Yearly Pro — best value
- Family Plan
- Secure Shopify checkout
- Educational disclaimer

**Speaker script**

Shopify handles the transaction layer, but the brand remains Patients Compass. Plan cards should explain the education experience, Health Companion access, document insights, biomarker organization, and doctor-visit preparation. The disclaimer remains visible: the service supports education and preparation and is not a diagnosis or treatment service.

---

## Slide 6 — Technical implementation

**On-slide message**

- Custom Liquid header section
- Custom Liquid hero section
- JSON template registration
- Theme draft first
- Connector scope verification

**Speaker script**

The design can be implemented as two reusable Shopify sections. The header section owns the credibility bar, logo, menu, search, and account actions. The hero section owns the editorial headline, CTA buttons, visual card, and supporting copy. JSON templates register these sections so the Theme Editor can control them. Work should begin in a duplicate or unpublished draft theme.

---

## Slide 7 — Connector scope gate

**On-slide message**

```text
read_themes
write_themes
```

**Speaker script**

If the Manus connector is expected to edit theme files programmatically, the Shopify app version must request `write_themes` in addition to `read_themes`. The version must be released, the store installation must approve the access change, and the Manus connector must be reconnected to My Store. Scope presence is verified through the read-only `currentAppInstallation` query. If the scope remains absent, the managed connector token must be refreshed by the connector owner.

---

## Slide 8 — Responsive quality bar

**On-slide message**

Validate at:

- 1440px
- 1280px
- 1024px
- 768px
- 390px
- 375px

**Speaker script**

The redesign is not complete when the desktop screenshot looks good. The header must collapse cleanly, the hero must avoid oversized mobile typography, the CTA buttons must remain touch-friendly, and the visual card must not create horizontal scrolling. The Theme Editor preview should be reviewed at desktop, tablet, and mobile widths before publishing.

---

## Slide 9 — Safe rollout

**On-slide message**

1. Duplicate or open draft theme.
2. Add header and hero sections.
3. Load logo and visual assets.
4. Configure colors and typography.
5. Test navigation and Shopify plan CTAs.
6. Review mobile and accessibility.
7. Publish only after owner approval.

**Speaker script**

The rollout is deliberately reversible. The live theme remains unchanged while the custom sections are built. After visual and functional validation, the owner reviews the draft. Publishing is the final action, not part of implementation.

---

## Slide 10 — Desired outcome

**On-slide message**

A Shopify storefront that feels like Patients Compass.

**Speaker script**

The desired outcome is a coherent ecosystem: the main Patients Compass site introduces the educational system, and Shopify provides a branded, trusted, and focused plan-selection and checkout experience. Visitors should never feel that they have left the Patients Compass brand when they move into commerce.
