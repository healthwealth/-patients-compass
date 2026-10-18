# Session TODO (uyr84md0)

## Full-Platform Audit Remediation

- [x] Fix App.tsx routing bug: stray `/dashboard` route outside Switch renders PurchaseConfirmation
- [x] Remove admin nav links (Admin Sign Up, Control) from public-facing Home.tsx nav
- [x] Replace fake "Download Free Tracker PDF" toast.success("Simulated") — now scrolls to real #newsletter section
- [x] Fix emailService.ts: all 5 email functions use token-based generateUnsubscribeUrl(userId)
- [x] Update emailScheduledHandlers.ts, emailReEngagementHandlers.ts, emailAutomationHandlers.ts to pass userId
- [x] Add SEO component to Features.tsx (was completely missing)
- [x] Fix stale Pricing.tsx SEO description (removed "lifetime access options available")
- [x] Remove test card badge from Pricing.tsx — replaced with "7-day money-back guarantee"
- [x] Fix UpgradePro.tsx Pro Annual: $99.99 → $80, "save 17%" → "save 33%"
- [x] Fix Features.tsx upgrade CTAs: /upgrade-pro → /pricing
- [x] Add full nav to Books.tsx (Features, Dr. Compass, Blog, Pricing) desktop + mobile
- [x] Add complete sticky site nav with mobile hamburger to Features.tsx
- [x] Add loading="lazy" to all 3 img tags in Books.tsx
- [x] Replace alert() in Books.tsx newsletter form with real trpc.email.subscribe mutation
- [x] Fix all /privacy-policy → /privacy and /terms-of-use → /terms across 7 files
- [x] Add id="newsletter" to email capture section in Home.tsx

## Follow-Up Improvements

- [x] Add full sticky nav to Pricing page (desktop + mobile hamburger) matching Features/Books
- [x] Wire PurchaseConfirmation to /purchase-confirmation route in App.tsx
- [x] Confirm SEO already present on MedicalAssistant.tsx and Contact.tsx (no changes needed)

## Round 3 — Post-Payment Onboarding, SEO Canonical, Stripe Loading, Skill

- [x] Upgrade PurchaseConfirmation with interactive onboarding checklist (persistent localStorage, real plan data, correct dashboard link)
- [x] Confirm SEO component already has canonical link tag (already implemented — no change needed)
- [x] Confirm Pricing + UpgradePro already have loading spinners and error handling (already implemented)
- [x] Create reusable post-payment-onboarding skill

## Round 4 — Confetti, Auto-Mark, Dashboard Progress Banner, Skill

- [x] Add confetti animation on first load of /purchase-confirmation (sessionStorage guard, brand colors, side-cannon pattern)
- [x] Auto-mark "Visit Dashboard" checklist step when user returns via ?from=dashboard query param
- [x] Add onboarding progress banner to Dashboard above stats grid (reads localStorage, dismissible via sessionStorage)
- [x] Create reusable confetti-onboarding-checklist skill (validated)

## Round 5 — Audit Skill, Stripe Plan Fetch, Celebration Card, Banner Animation

- [ ] Create reusable webdev-audit-remediation skill documenting the full-platform audit & fix workflow
- [ ] Add public tRPC procedure to look up Stripe checkout session by session_id and return plan name
- [ ] Update PurchaseConfirmation to fetch plan name from Stripe session_id (public-safe, no auth required)
- [ ] Add celebration card with pre-filled tweet that appears when all 5 checklist items are completed
- [ ] Add slide-down entrance animation to dashboard progress banner
- [ ] Add interactive hover effects to the "Continue setup checklist →" link in dashboard banner
- [x] Create reusable webdev-audit-remediation skill documenting the full-platform audit & fix workflow
- [x] Add public tRPC procedure to look up Stripe checkout session by session_id and return plan name
- [x] Update PurchaseConfirmation to fetch plan name from Stripe session_id (public-safe, no auth required)
- [x] Add celebration card with pre-filled tweet that appears when all 5 checklist items are completed
- [x] Add slide-down entrance animation to dashboard progress banner
- [x] Add interactive hover effects to the "Continue setup checklist →" link in dashboard banner

## Round 6 — Post-Payment Skill, Referral Link, Permanent Dismiss, Celebration Confetti

- [x] Create new post-payment-onboarding reusable skill documenting the full workflow
- [x] Add tRPC procedure to generate a unique referral URL using the user's ID
- [x] Add 'Copy Link' button to celebration card that copies the referral URL to clipboard
- [x] Modify dashboard banner to permanently dismiss via localStorage when all 5 steps are done
- [x] Add full-screen confetti burst that fires when the celebration card first appears

## Round 7 — Referral Skill, Dashboard Referrals Card, Editable Tweet, Tweet Preview

- [x] Update post-payment-onboarding skill with referral dashboard card and editable tweet preview patterns
- [x] Add Referrals stat card to dashboard grid (referral count + pending credits via trpc.referral.getEarnings)
- [x] Add editable textarea for tweet text in celebration card (pre-filled, user can customise before sharing)
- [x] Add live tweet preview panel in celebration card showing avatar, handle, tweet text, and referral URL
