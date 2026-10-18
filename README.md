# The Patient's Compass — Cloudflare edition

thepatientscompass.com, moved off Manus and onto Cloudflare. One Cloudflare Worker serves everything.

| Piece | On Manus | On Cloudflare |
| --- | --- | --- |
| Hosting | Manus server (Express) | Worker `patients-compass` (same Express app, through Workers' Node.js HTTP support) |
| Web pages | Express static files | Workers Static Assets (`dist/public`) |
| Database | Manus MySQL (TiDB) | D1 database `patients-compass-db` |
| Images / PDFs / video / uploads | Manus storage at `/manus-storage/*` | R2 bucket `patients-compass-files`, same `/manus-storage/*` URLs |
| AI (lab analyzer, Health Companion, lifestyle plans, support chat) | Manus built-in LLM | Anthropic Claude via `ANTHROPIC_API_KEY` |
| Sign-in | Manus OAuth + email/password | Email/password, email link and Google (Manus OAuth removed) |
| Admin access | Manus owner account | Any account whose email is in `ADMIN_EMAILS` |
| Owner notifications | Manus notifications | Email to `OWNER_EMAIL` through Resend |
| Scheduled emails / analytics | Manus "Heartbeat" cron | Cron Trigger, hourly (`server/_core/scheduledJobs.ts`) |

## Layout

```
worker/index.ts            Worker entry: routing, storage, cron
worker/shims/iconv-lite.js Small shim so Express's body parser bundles for Workers
server/app.ts              The Express app (API, webhooks, scheduled jobs, sitemap)
server/_core/runtime.ts    Access to D1 / R2 bindings from server code
server/_core/llm.ts        OpenAI-style invokeLLM() → Anthropic Messages API
server/_core/storageProxy.ts  R2 file serving + copy-on-first-request from Manus
server/handlers/migrationHandler.ts  Admin import of Manus data + files
client/src/pages/AdminMigration.tsx  /admin/migration page for the above
drizzle/schema.ts          Database schema (SQLite / D1)
migrations/                D1 migrations (applied on every deploy)
wrangler.jsonc             Worker config: bindings, cron, non-secret variables
```

## Commands

```bash
pnpm install
pnpm build                      # asset manifest + Vite build into dist/public
pnpm dev                        # build, then run locally in the Workers runtime (local D1/R2)
pnpm db:migrate:local           # apply migrations to the local D1
pnpm test                       # unit tests (Vitest)
pnpm deploy                     # build, wrangler deploy, apply D1 migrations remotely
```

For local runs put secrets in `.dev.vars` (git-ignored), e.g. `JWT_SECRET=…`, `CRON_SECRET=…`, `NODE_ENV=development`.

## Deploying

See **CLOUDFLARE_DEPLOY_GUIDE.md**. In short: `wrangler deploy` creates the D1 database and R2 bucket automatically on the first run, then `wrangler d1 migrations apply DB --remote` creates the tables. With Cloudflare Workers Builds (Git integration) use:

- Build command: `pnpm build`
- Deploy command: `npx wrangler deploy && npx wrangler d1 migrations apply DB --remote`

The Workers **Paid** plan is required: password hashing, PDF reading and AI requests need more CPU time than the free plan's 10 ms per request.

## Settings

Non-secret values live in `wrangler.jsonc` → `vars`. Secrets are added in the Cloudflare dashboard (Worker → Settings → Variables and Secrets) or with `npx wrangler secret put NAME`.

| Name | Needed for | Notes |
| --- | --- | --- |
| `JWT_SECRET` | Sign-in sessions | Any long random string. Required. |
| `CRON_SECRET` | Scheduled emails | Any long random string. Required. |
| `ANTHROPIC_API_KEY` | All AI features | From console.anthropic.com. Required. |
| `RESEND_API_KEY` | Verification, password reset, welcome emails | Required for email sign-up to work (accounts must verify their email). |
| `GOOGLE_CLIENT_ID` | "Continue with Google" | Not secret; the existing Patients Compass Web Client ID. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe checkout + webhook | Webhook URL: `/api/stripe/webhook`. |
| `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID` | Stripe plans | `price_…` IDs. |
| `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_WEBHOOK_SECRET` | Shopify checkout + webhook | Webhook URL: `/api/shopify/webhook`. |
| `SHOPIFY_MONTHLY_VARIANT_ID`, `SHOPIFY_YEARLY_VARIANT_ID`, `SHOPIFY_MONTHLY_SELLING_PLAN_ID`, `SHOPIFY_YEARLY_SELLING_PLAN_ID` | Shopify plans | Copy from the Manus project settings. |
| `GTM_CONTAINER_ID` | Google Tag Manager | Optional. |
| `ANTHROPIC_MODEL` | AI model | Optional, defaults to `claude-sonnet-5-5`. Change here if Anthropic retires a model. |
| `ADMIN_EMAILS`, `OWNER_EMAIL`, `LEGACY_ASSET_ORIGIN`, `PUBLIC_SITE_URL`, `APP_URL`, `CANONICAL_HOST`, `RESEND_SENDER_EMAIL` | Set in `wrangler.jsonc` | Edit there. |

## Moving data and files from Manus

1. **Files**: every `/manus-storage/…` file is copied from `LEGACY_ASSET_ORIGIN` (the old `*.manus.space` address) into R2 the first time it is requested, and the hourly cron copies the rest. `/admin/migration` has a "Copy files now" button. Keep the Manus project published until it reports "all done".
2. **Data**: ask Manus to export the database as `{ "tables": { "<table>": [rows] } }` JSON (the exact request is on `/admin/migration`) and upload it there. Import is idempotent. New rows on Cloudflare start at id 1,000,000,001 (`migrations/0001_id_offset.sql`), so they never collide with imported Manus ids, and an imported account whose email already exists on the new site is merged into it.

Accounts that signed up with a password keep working with the same password. Accounts that only ever used Manus login have no password; they can use "email sign-in link", "Forgot password", or Google with the same email.
