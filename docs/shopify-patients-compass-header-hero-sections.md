# Patients Compass Shopify Header and Hero Sections

These are copy-ready structures for a Shopify Online Store 2.0 theme. Add the Liquid files through a draft theme or the Shopify Theme Code Editor. Do not edit the live theme first.

## 1. `sections/patients-compass-header.liquid`

```liquid
{% liquid
  assign nav_menu = section.settings.menu
  assign nav_links = linklists[nav_menu].links
%}

<header class="pc-header" data-section-id="{{ section.id }}">
  {% if section.settings.announcement_text != blank %}
    <div class="pc-credibility-bar">
      <span class="pc-credibility-mark" aria-hidden="true">✦</span>
      <span>{{ section.settings.announcement_text | escape }}</span>
    </div>
  {% endif %}

  <div class="pc-header-inner page-width">
    <a class="pc-brand" href="{{ routes.root_url }}" aria-label="{{ shop.name | escape }} home">
      {% if section.settings.logo != blank %}
        {{ section.settings.logo
          | image_url: width: 520
          | image_tag:
            class: 'pc-logo-image',
            widths: '180,260,360,520',
            sizes: '(max-width: 749px) 180px, 260px',
            loading: 'eager',
            alt: section.settings.logo_alt
        }}
      {% else %}
        <span class="pc-brand-name">The Patient's Compass</span>
        <span class="pc-brand-subtitle">Health Intelligence System</span>
      {% endif %}
    </a>

    <button class="pc-menu-toggle" type="button" aria-expanded="false" aria-controls="pc-main-nav-{{ section.id }}">
      <span class="visually-hidden">Open navigation</span>
      <span aria-hidden="true">☰</span>
    </button>

    <nav id="pc-main-nav-{{ section.id }}" class="pc-main-nav" aria-label="Primary navigation">
      {% for link in nav_links %}
        <a href="{{ link.url }}" class="pc-nav-link{% if link.active %} is-active{% endif %}">
          {{ link.title | escape }}
        </a>
      {% endfor %}
    </nav>

    <div class="pc-header-actions">
      {% if section.settings.activity_pack_url != blank %}
        <a class="pc-resource-link" href="{{ section.settings.activity_pack_url }}">
          <span aria-hidden="true">▧</span>
          <span>Your Super Kid</span>
        </a>
      {% endif %}

      <a class="pc-search-link" href="{{ routes.search_url }}" aria-label="Search resources">Search</a>

      {% if shop.customer_accounts_enabled %}
        <a class="pc-signup-link" href="{{ routes.account_register_url }}">Sign up</a>
        <a class="pc-signin-link" href="{{ routes.account_login_url }}">Sign in</a>
      {% endif %}
    </div>
  </div>
</header>

<style>
  .pc-header { background: #FBF9F6; border-bottom: 1px solid #D3D0C9; color: #2D3142; }
  .pc-credibility-bar { min-height: 36px; padding: 8px 20px; background: #88A18F; color: #FBF9F6; text-align: center; font-size: 13px; letter-spacing: .02em; }
  .pc-credibility-mark { margin-right: 8px; }
  .pc-header-inner { min-height: 96px; display: flex; align-items: center; gap: 24px; }
  .pc-brand { display: inline-flex; flex-direction: column; flex: 0 0 190px; color: #2D2926; text-decoration: none; }
  .pc-logo-image { display: block; width: 180px; height: auto; object-fit: contain; }
  .pc-brand-name { font-family: Georgia, serif; font-size: 22px; line-height: 1.05; }
  .pc-brand-subtitle { margin-top: 6px; color: #6D716C; font-size: 10px; letter-spacing: .11em; text-transform: uppercase; }
  .pc-main-nav { display: flex; align-items: center; justify-content: center; gap: 18px; flex: 1; }
  .pc-nav-link, .pc-search-link, .pc-signup-link { color: #2D3142; text-decoration: none; font-size: 14px; }
  .pc-nav-link:hover, .pc-nav-link.is-active, .pc-search-link:hover { color: #D98C73; }
  .pc-header-actions { display: flex; align-items: center; gap: 10px; white-space: nowrap; }
  .pc-resource-link, .pc-signup-link, .pc-signin-link { border: 1px solid #D3D0C9; border-radius: 999px; padding: 10px 14px; text-decoration: none; font-size: 13px; }
  .pc-resource-link { color: #2D3142; background: #FFFFFF; }
  .pc-signup-link { color: #2D3142; background: transparent; }
  .pc-signin-link { color: #FBF9F6; background: #769889; border-color: #769889; }
  .pc-menu-toggle { display: none; border: 1px solid #D3D0C9; background: #FFFFFF; color: #2D3142; border-radius: 8px; padding: 10px 12px; }
  .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
  @media screen and (max-width: 1100px) {
    .pc-main-nav { gap: 11px; }
    .pc-nav-link { font-size: 12px; }
    .pc-header-actions { gap: 6px; }
    .pc-resource-link, .pc-signup-link, .pc-signin-link { padding: 8px 10px; }
  }
  @media screen and (max-width: 850px) {
    .pc-header-inner { min-height: 72px; justify-content: space-between; }
    .pc-menu-toggle { display: inline-flex; }
    .pc-main-nav { display: none; position: absolute; z-index: 10; left: 16px; right: 16px; top: 108px; flex-direction: column; align-items: stretch; padding: 16px; gap: 0; background: #FFFFFF; border: 1px solid #D3D0C9; border-radius: 12px; }
    .pc-main-nav.is-open { display: flex; }
    .pc-nav-link { padding: 12px 8px; border-bottom: 1px solid #D3D0C9; }
    .pc-header-actions { gap: 6px; }
    .pc-search-link, .pc-resource-link { display: none; }
    .pc-brand { flex-basis: auto; }
    .pc-logo-image { width: 160px; }
  }
</style>

<script>
  (() => {
    const root = document.querySelector('[data-section-id="{{ section.id }}"]');
    if (!root) return;
    const toggle = root.querySelector('.pc-menu-toggle');
    const nav = root.querySelector('.pc-main-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  })();
</script>

{% schema %}
{
  "name": "Patients Compass header",
  "settings": [
    { "type": "image_picker", "id": "logo", "label": "Logo" },
    { "type": "text", "id": "logo_alt", "label": "Logo alt text", "default": "The Patient's Compass" },
    { "type": "text", "id": "announcement_text", "label": "Credibility bar", "default": "Built by a Clinical Laboratory Scientist with 20+ Years of Experience" },
    { "type": "link_list", "id": "menu", "label": "Main menu", "default": "main-menu" },
    { "type": "url", "id": "activity_pack_url", "label": "Super Kid Activity Pack URL" }
  ],
  "presets": [
    { "name": "Patients Compass header" }
  ]
}
{% endschema %}
```

## 2. `sections/patients-compass-hero.liquid`

```liquid
<section class="pc-hero" data-section-id="{{ section.id }}">
  <div class="pc-hero-inner page-width">
    <div class="pc-hero-copy">
      {% if section.settings.eyebrow != blank %}
        <p class="pc-eyebrow">✦ {{ section.settings.eyebrow | escape }}</p>
      {% endif %}

      <h1>{{ section.settings.heading | escape }}</h1>
      <p class="pc-hero-lede">{{ section.settings.lede | escape }}</p>

      <div class="pc-hero-actions">
        {% if section.settings.primary_label != blank and section.settings.primary_url != blank %}
          <a class="pc-button pc-button-primary" href="{{ section.settings.primary_url }}">
            {{ section.settings.primary_label | escape }} <span aria-hidden="true">→</span>
          </a>
        {% endif %}
        {% if section.settings.secondary_label != blank and section.settings.secondary_url != blank %}
          <a class="pc-button pc-button-secondary" href="{{ section.settings.secondary_url }}">
            {{ section.settings.secondary_label | escape }}
          </a>
        {% endif %}
      </div>

      {% if section.settings.proof_text != blank %}
        <p class="pc-proof"><span aria-hidden="true">●</span> {{ section.settings.proof_text | escape }}</p>
      {% endif %}
    </div>

    <div class="pc-hero-visual">
      <div class="pc-hero-card">
        {% if section.settings.hero_image != blank %}
          {{ section.settings.hero_image
            | image_url: width: 1000
            | image_tag:
              class: 'pc-hero-image',
              widths: '480,720,1000',
              sizes: '(max-width: 749px) 92vw, 520px',
              loading: 'eager',
              alt: section.settings.image_alt
          }}
        {% endif %}
        <div class="pc-card-body">
          <p class="pc-card-kicker">{{ section.settings.card_kicker | escape }}</p>
          <h2>{{ section.settings.card_heading | escape }}</h2>
          <p>{{ section.settings.card_text | escape }}</p>
        </div>
      </div>
    </div>
  </div>
</section>

<style>
  .pc-hero { background: #F8F5EF; border-bottom: 1px solid #D3D0C9; }
  .pc-hero-inner { min-height: 650px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, 520px); gap: 72px; align-items: center; padding-top: 72px; padding-bottom: 72px; }
  .pc-eyebrow { display: inline-block; margin-bottom: 24px; padding: 8px 14px; border: 1px solid #D3D0C9; border-radius: 999px; background: #FFFFFF; color: #6D716C; font-size: 13px; }
  .pc-hero h1 { max-width: 720px; margin: 0; color: #2D2926; font-family: Georgia, serif; font-size: clamp(42px, 5vw, 72px); line-height: 1.04; letter-spacing: -.035em; }
  .pc-hero h1 em { color: #D98C73; font-style: italic; }
  .pc-hero-lede { max-width: 650px; margin: 28px 0 0; color: #5B5E5A; font-size: 18px; line-height: 1.65; }
  .pc-hero-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 32px; }
  .pc-button { display: inline-flex; align-items: center; gap: 10px; min-height: 48px; padding: 13px 20px; border-radius: 999px; text-decoration: none; font-size: 15px; font-weight: 700; }
  .pc-button-primary { background: #769889; color: #FFFFFF; }
  .pc-button-secondary { background: #FFFFFF; border: 1px solid #D3D0C9; color: #2D2926; }
  .pc-proof { margin-top: 24px; color: #6D716C; font-size: 13px; }
  .pc-proof span { color: #88A18F; }
  .pc-hero-card { overflow: hidden; border: 1px solid #D3D0C9; border-radius: 28px; background: #FFFFFF; box-shadow: 0 18px 45px rgba(45, 41, 38, .12); }
  .pc-hero-image { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; }
  .pc-card-body { padding: 24px; }
  .pc-card-kicker { margin: 0 0 10px; color: #769889; font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .pc-card-body h2 { margin: 0 0 10px; color: #2D2926; font-family: Georgia, serif; font-size: 27px; }
  .pc-card-body p:last-child { margin: 0; color: #6D716C; font-size: 15px; line-height: 1.55; }
  @media screen and (max-width: 749px) {
    .pc-hero-inner { min-height: 0; grid-template-columns: 1fr; gap: 36px; padding-top: 48px; padding-bottom: 48px; }
    .pc-hero h1 { font-size: 42px; }
    .pc-hero-lede { font-size: 17px; }
    .pc-hero-actions { flex-direction: column; align-items: stretch; }
    .pc-button { justify-content: center; }
  }
</style>

{% schema %}
{
  "name": "Patients Compass hero",
  "settings": [
    { "type": "text", "id": "eyebrow", "label": "Eyebrow", "default": "The Patient's Compass Health Intelligence System" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "Turn confusing lab results into a structured doctor conversation." },
    { "type": "textarea", "id": "lede", "label": "Supporting copy", "default": "Built by a Clinical Laboratory Scientist—not just software engineers. Learn from lab information, organize questions, and prepare for better conversations with your care team." },
    { "type": "text", "id": "primary_label", "label": "Primary button label", "default": "Take the Start Here Quiz" },
    { "type": "url", "id": "primary_url", "label": "Primary button URL" },
    { "type": "text", "id": "secondary_label", "label": "Secondary button label", "default": "Try AI Lab Scanner" },
    { "type": "url", "id": "secondary_url", "label": "Secondary button URL" },
    { "type": "text", "id": "proof_text", "label": "Proof line", "default": "Someone joined the waitlist recently" },
    { "type": "image_picker", "id": "hero_image", "label": "Health Companion image" },
    { "type": "text", "id": "image_alt", "label": "Image alt text", "default": "Patients Compass Health Companion" },
    { "type": "text", "id": "card_kicker", "label": "Card kicker", "default": "Ecosystem foundation" },
    { "type": "text", "id": "card_heading", "label": "Card heading", "default": "The Core Health Moat" },
    { "type": "textarea", "id": "card_text", "label": "Card text", "default": "Go beyond simple OCR and interpretation with structured health education and doctor-visit preparation." }
  ],
  "presets": [
    { "name": "Patients Compass hero" }
  ]
}
{% endschema %}
```

## 3. Register the custom sections in JSON templates

### Homepage: `templates/index.json`

Use the existing JSON template and replace the main hero section with this structure. Preserve any existing sections you still need.

```json
{
  "sections": {
    "patients_compass_hero": {
      "type": "patients-compass-hero",
      "settings": {
        "primary_url": "/pages/start-here",
        "secondary_url": "/pages/ai-lab-scanner"
      }
    }
  },
  "order": ["patients_compass_hero"]
}
```

### Header group: `sections/header-group.json`

If the theme uses a header group, replace the header section type with the custom section. Preserve the group’s other sections if present.

```json
{
  "type": "header-group",
  "name": "Header group",
  "sections": {
    "patients_compass_header": {
      "type": "patients-compass-header",
      "settings": {
        "announcement_text": "Built by a Clinical Laboratory Scientist with 20+ Years of Experience",
        "menu": "main-menu",
        "activity_pack_url": "/pages/super-kids"
      }
    }
  },
  "order": ["patients_compass_header"]
}
```

## Important implementation notes

- Work in a duplicate or unpublished draft theme first.
- The `write_themes` scope is required for API-based theme-file changes, but manual Theme Editor changes can be made without that connector scope.
- Shopify may require the theme to support Online Store 2.0 section groups. If the current Helio theme does not accept `header-group.json`, use its existing header section and paste the header markup into the supported section file instead.
- Replace the placeholder URLs with real Patients Compass routes.
- Upload the approved Health Companion image through Shopify Files or the theme customizer; do not use a guessed external URL.
- Validate the header and hero at desktop, tablet, and mobile widths before publishing.
- Preserve the educational disclaimer and avoid diagnosis or treatment claims.
