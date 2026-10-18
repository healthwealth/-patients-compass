# Patients Compass — Calm Clinical Editorial Theme Redesign

## Purpose

This script explains how to update the Shopify connector so theme editing is authorized, then manually apply the Calm clinical editorial visual direction in Shopify's Theme Editor.

---

## Part 1 — Updating the Shopify connector with `write_themes`

### Important distinction

`write_themes` is an **Admin API access scope**. It cannot be granted by a GraphQL query and it should never be added to a token manually in source code. The scope must be requested by the Shopify app version, approved during installation, and then propagated to the specific Manus connector token.

### Required sequence

1. Open the Shopify Dev Dashboard for the Patients Compass app.
2. Open the app's configuration or API access section.
3. Add:

   ```text
   write_themes
   ```

4. Preserve the existing theme scope:

   ```text
   read_themes
   ```

5. Preserve the subscription and commerce scopes already required by the application:

   ```text
   read_own_subscription_contracts
   write_own_subscription_contracts
   read_products
   write_products
   read_orders
   read_customers
   unauthenticated_read_product_listings
   unauthenticated_read_selling_plans
   unauthenticated_read_checkouts
   unauthenticated_write_checkouts
   ```

6. Create and release a new app version. Use a clear version name such as:

   ```text
   Patients Compass theme editing and subscription scopes
   ```

7. In Shopify Admin, approve the access-change or reinstall screen for the `patientcompashealth` store.
8. In Manus, open **Settings → Connectors → Shopify**.
9. Choose **Reconnect**.
10. Select **My Store / patientcompashealth** as the active account.
11. Complete the authorization flow.
12. Verify the active installation with this read-only query:

   ```graphql
   query AccessScopeList {
     currentAppInstallation {
       accessScopes {
         handle
       }
     }
   }
   ```

13. Confirm that the response contains:

   ```text
   read_themes
   write_themes
   ```

### If `write_themes` remains absent

The Shopify Dev Dashboard app and the Manus connector may be separate installations or may use different credentials. In that case:

- Do not edit tokens manually.
- Do not paste secrets into chat or source files.
- Confirm that the active Manus connector account is **patientcompashealth**, not another Shopify store.
- Reconnect the connector after the new app version is released.
- If the connector still reports the old scopes, request a **managed connector token refresh** from Manus support at [help.manus.im](https://help.manus.im).
- While waiting, use the Shopify Theme Editor manually; theme editing does not require the connector's `write_themes` scope.

### Scope safety note

`write_themes` is powerful: it can modify storefront theme files. Apply it only to a draft theme, validate the preview, and do not publish until the owner has reviewed desktop and mobile layouts.

---

## Part 2 — Manual Theme Editor walkthrough

### Slide 1 — Start with a draft

**On-screen steps**

1. Shopify Admin → **Online Store → Themes**.
2. Duplicate the active theme or open the current theme's draft customization view.
3. Click **Customize**.
4. Confirm the top bar identifies the correct store: `patientcompashealth`.
5. Keep the existing live theme unchanged until review is complete.

**Speaker script**

We will make the Calm clinical editorial changes in the draft preview first. This keeps the current storefront reversible and prevents an incomplete redesign from reaching visitors.

---

### Slide 2 — Set the color system

Use the closest matching Shopify color fields:

| Theme role | Hex | Use |
|---|---:|---|
| Deep teal | `#0F4C5C` | Primary headings, navigation emphasis, primary buttons |
| Health green | `#2A9D8F` | Success states, secondary actions, selected plan state |
| Warm ivory | `#FBF9F6` | Main page background |
| Soft sand | `#EFECE5` | Cards, section panels, subtle bands |
| Charcoal | `#2D3142` | Body copy and navigation text |
| Divider gray | `#D3D0C9` | Borders, rules, input outlines |

**Theme Editor path**

1. Open **Theme settings**.
2. Open **Colors**.
3. Set **Background 1 / page background** to `#FBF9F6`.
4. Set **Background 2 / card background** to `#EFECE5`.
5. Set **Text / primary text** to `#2D3142`.
6. Set **Solid button background** to `#0F4C5C`.
7. Set **Solid button text** to `#FBF9F6`.
8. Set **Secondary button or accent** to `#2A9D8F`.
9. Set borders and input outlines to `#D3D0C9`.
10. Save the draft and inspect the preview.

**Accessibility check**

- Body text must remain dark charcoal on warm ivory.
- White or ivory button text must be used on deep teal buttons.
- Do not use light green text on a white background.
- Confirm visible keyboard focus states remain present.

**Speaker script**

The palette is intentionally warm and restrained. Deep teal establishes trust and hierarchy; health green is reserved for confirmation and selected states; warm ivory removes the sterile, generic white canvas; charcoal keeps longer educational copy comfortable to read.

---

### Slide 3 — Choose typography

**Recommended editorial pairing**

- Headings: **Cormorant Garamond** or the closest available refined serif.
- Body and navigation: **DM Sans**, **Inter**, or the closest available clean sans-serif.
- Fallbacks: `Georgia` for headings and `Arial` or `Helvetica Neue` for body copy.

**Theme Editor path**

1. Open **Theme settings → Typography**.
2. Set the heading font to the closest available editorial serif.
3. Set the body font to a clean humanist sans-serif.
4. Reduce heading scale from the oversized Helio default.
5. Use a readable body size and generous line height.
6. Preview long headings at 375px and 768px widths.

**Recommended hierarchy**

- Hero heading: 48–64px desktop; 34–40px mobile.
- Section heading: 32–40px desktop; 26–32px mobile.
- Body copy: 17–19px desktop; 16–18px mobile.
- Button text: 15–16px with medium or semibold weight.

**Speaker script**

The typography should feel editorial but not ornamental. The serif is used only for moments of orientation and emphasis. The sans-serif carries navigation, plan details, educational explanations, and legal copy so the site remains practical and accessible.

---

### Slide 4 — Rebuild the header hierarchy

**Theme Editor path**

1. Open **Header**.
2. Upload the Patients Compass logo.
3. Use a transparent PNG or SVG with strong contrast.
4. Set a moderate desktop logo width.
5. Set a smaller mobile width.
6. Keep navigation labels short:
   - Home
   - Plans
   - Health Companion
   - Resources
   - About
7. Keep one primary header action: **View Plans**.
8. Confirm the header does not wrap at 1280px, 1024px, 768px, or 375px.

**Speaker script**

The header should identify the brand immediately and guide visitors toward plans without competing with the hero. The navigation should be shorter and more intentional than the default Helio structure.

---

### Slide 5 — Replace the generic hero

**Recommended hero copy**

**Headline:**

> Understand your health information with more clarity.

**Supporting copy:**

> Patients Compass helps you learn from lab information, organize questions, and prepare for better conversations with your care team. It is educational support—not diagnosis or treatment.

**Primary CTA:**

> Explore plans

**Secondary CTA:**

> Meet the Health Companion

**Layout guidance**

- Use a two-column desktop composition.
- Keep the text column narrower than the visual column.
- Use the professional Sonya / Health Companion portrait or existing hero video.
- Use rounded corners sparingly and consistently.
- Keep the hero headline below the current oversized Helio scale.

**Speaker script**

The new hero leads with clarity and empowerment rather than a generic product statement. It explains the educational boundary directly and gives visitors two clear paths: evaluate plans or understand the Health Companion experience.

---

### Slide 6 — Make plans the conversion center

**Recommended plan order**

1. Monthly Pro
2. Yearly Pro — visually marked as the best value
3. Family Plan

**Plan card guidance**

- Use warm ivory or white cards on the soft sand section background.
- Use deep teal for the main CTA.
- Use health green only for the selected or recommended state.
- Display price, billing cadence, three concise benefits, and an educational disclaimer.
- Keep the Yearly savings message visible without aggressive sales styling.
- Link each CTA to the corresponding Shopify checkout flow.

**Speaker script**

The plan section should be the clearest part of the storefront. Visitors should understand the difference between Monthly, Yearly, and Family without scrolling through a generic catalog experience. The Yearly plan receives emphasis through a quiet green “Best value” treatment rather than a loud promotional badge.

---

### Slide 7 — Add editorial resource sections

**Recommended sections**

- What Patients Compass helps you understand
- Health Companion preview
- Lab education and document insights
- Doctor-visit preparation
- Healthy Habits for Super Kids
- Frequently asked questions

**Visual treatment**

- Alternate warm ivory and soft sand section backgrounds.
- Use short editorial headings.
- Add one supporting visual per section.
- Keep copy focused on education, organization, and preparation.
- Avoid claims of diagnosis, treatment, or guaranteed outcomes.

**Speaker script**

The storefront should feel like a trusted health-education publication with commerce attached—not a generic product grid. Resource sections build confidence before a visitor reaches the plan cards.

---

### Slide 8 — Announcement bar and footer

**Announcement bar copy**

> Patients Compass education plans are now available through secure Shopify checkout.

**Footer requirements**

- Patients Compass logo or wordmark
- Plans link
- Health Companion link
- Resources link
- Privacy and Terms links
- Educational-only disclaimer
- Activity Pack link where appropriate

**Speaker script**

The announcement bar should be short, informative, and non-clinical. The footer should provide trust and escape routes without becoming visually heavy.

---

### Slide 9 — Responsive and accessibility review

**Test widths**

- 1440px desktop
- 1280px desktop
- 1024px tablet landscape
- 768px tablet portrait
- 390px mobile
- 375px mobile

**Check**

- No horizontal scrolling.
- Header stays on one usable row or collapses cleanly.
- Hero headline does not dominate the entire mobile viewport.
- Buttons remain at least 44px tall.
- Text contrast remains readable.
- Focus indicators remain visible.
- Images have useful alternative text.
- Announcement bar does not obscure content.

**Speaker script**

A calm visual style is only successful if it remains calm on mobile. The final review checks the actual visitor experience, not just the desktop editor preview.

---

### Slide 10 — Publish gate

**Do not publish until all are true**

- [ ] Logo is correct and crisp.
- [ ] Colors match the Patients Compass palette.
- [ ] Typography is readable at mobile and desktop widths.
- [ ] Hero copy contains the educational boundary.
- [ ] Monthly, Yearly, and Family CTAs resolve correctly.
- [ ] Shopify checkout host is the intended `patientcompashealth.myshopify.com` store.
- [ ] No real payment was submitted during visual validation.
- [ ] Privacy, Terms, and disclaimer links work.
- [ ] Owner reviewed the draft preview.

**Speaker script**

Publishing is the last step, not part of the first design pass. The draft should be reviewed as a complete storefront across devices before the theme is made live. If any Shopify editor control behaves unexpectedly, keep the live theme unchanged and resolve the editor or connector issue first.

---

## Final design summary

The Calm clinical editorial direction replaces the generic Helio black-and-white presentation with:

- Warm ivory foundations
- Deep teal brand hierarchy
- Restrained health-green accents
- Editorial headings with practical sans-serif body text
- A welcoming Health Companion-led hero
- Plan cards that make Monthly, Yearly, and Family choices clear
- Resource sections that establish trust before checkout
- A quiet, professional, accessible mobile experience
