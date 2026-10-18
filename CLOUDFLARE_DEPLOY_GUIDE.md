# Moving The Patient's Compass from Manus to Cloudflare

Everything below happens in web dashboards (Cloudflare, GitHub, Manus, Stripe, GoDaddy). Keep the Manus site running until step 7 is finished; the new site copies your images and files from it.

**What you need before starting**

- Your Cloudflare account (the one that runs asksonya.ai)
- A GitHub account
- Your Anthropic API key (console.anthropic.com → API Keys; making a separate key for this site is a good idea)
- Your Resend API key (resend.com → API Keys) — the site uses it for verification and password-reset emails
- Access to the Manus project, Stripe, and GoDaddy (where thepatientscompass.com is registered)

---

## 1. Turn on two things in Cloudflare (one time)

1. **Workers Paid plan** — Cloudflare dashboard → *Workers & Pages* → *Plans* → choose **Paid ($5/month)**. Sign-in, PDF reading and the AI tools need more processing time per visit than the free plan allows.
2. **R2 storage** — dashboard → *R2 Object Storage* → *Get started* / *Purchase R2 Plan*. The first 10 GB are free; this is where your images, PDFs and video will live.

## 2. Put the code on GitHub

1. Go to **github.com/new**. Name it `patients-compass`, choose **Private**, and leave every "add a file" box unticked. Click *Create repository*.
2. Either let Claude push the code into it (tell Claude the repository name), or upload the contents of `patients-compass-cloudflare.zip` there.

## 3. Create the Worker from GitHub

1. Cloudflare dashboard → *Workers & Pages* → *Create* → *Import a repository*.
2. Connect GitHub if asked, then pick the `patients-compass` repository.
3. Set:
   - **Project name:** `patients-compass` (must match exactly)
   - **Build command:** `pnpm build`
   - **Deploy command:** `npx wrangler deploy && npx wrangler d1 migrations apply DB --remote`
4. Click *Create and deploy*. The first build takes 2–3 minutes. It creates the database (`patients-compass-db`) and the file storage (`patients-compass-files`) automatically.

When it finishes you get an address like `https://patients-compass.<your-name>.workers.dev`. Every time the code changes on GitHub, Cloudflare redeploys by itself.

## 4. Add the secret settings

Worker `patients-compass` → *Settings* → *Variables and Secrets* → *Add*. Choose type **Secret** for each:

| Name | Value |
| --- | --- |
| `JWT_SECRET` | The long random value Claude gave you (keeps people signed in) |
| `CRON_SECRET` | The second long random value Claude gave you (protects the scheduled emails) |
| `ANTHROPIC_API_KEY` | Your Anthropic key (`sk-ant-…`) |
| `RESEND_API_KEY` | Your Resend key (`re_…`) |

Then copy these from **Manus → your project → Settings → Secrets / Environment** (same names), if you use them:

| Name | What it's for |
| --- | --- |
| `GOOGLE_CLIENT_ID` (Manus calls it `VITE_GOOGLE_CLIENT_ID`) | "Continue with Google" button — add as a plain *Text* variable |
| `STRIPE_SECRET_KEY`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID` | Stripe checkout (use your **live** key `sk_live_…` when you're ready to take payments) |
| `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`, `SHOPIFY_MONTHLY_VARIANT_ID`, `SHOPIFY_YEARLY_VARIANT_ID`, `SHOPIFY_MONTHLY_SELLING_PLAN_ID`, `SHOPIFY_YEARLY_SELLING_PLAN_ID` | Shopify Pro checkout |
| `GTM_CONTAINER_ID` (Manus: `VITE_GTM_CONTAINER_ID`) | Google Tag Manager, optional |

Click *Deploy* after adding them so the Worker picks them up.

## 5. Sign in as the owner

1. Open your `workers.dev` address and go to **/signup**.
2. Create your account with **smkhit@gmail.com** and confirm the email. Accounts using that email are automatically admins (to change the list, edit `ADMIN_EMAILS` in `wrangler.jsonc`).

## 6. Bring your data across

1. On the new site, go to **/admin/migration**.
2. Click **Copy files now**. It copies every image, PDF and the hero video from the Manus site. (It also keeps doing this by itself every hour.)
3. In the same page, click the copy icon next to the request for Manus, paste it into your Manus project chat, and download the JSON file Manus gives you.
4. Back on **/admin/migration**, click **Upload export file** and choose that JSON file. A table shows what came over. Running it twice is safe.

Members who signed up with a password keep the same password. Anyone who only used the old Manus login can use **Forgot password**, the **email sign-in link**, or **Continue with Google**.

## 7. Point thepatientscompass.com at Cloudflare

1. Cloudflare dashboard → *Add a domain* → `thepatientscompass.com` → **Free** plan. Cloudflare copies your current DNS records.
2. Cloudflare shows two nameservers (like `xxx.ns.cloudflare.com`). In **GoDaddy** → *My Products* → thepatientscompass.com → *DNS* → *Nameservers* → *Change* → *I'll use my own nameservers*, paste both, save. This usually takes under an hour (can be up to 24).
3. When Cloudflare says the domain is **Active**: Worker `patients-compass` → *Settings* → *Domains & Routes* → *Add* → *Custom domain* → `thepatientscompass.com`. Repeat for `www.thepatientscompass.com`. If Cloudflare says a record already exists, let it replace the old Manus record.
4. If you use Resend with this domain, check Resend → *Domains* still shows it verified (Cloudflare copied the records, so it normally does).

## 8. Update the payment webhooks

The webhook addresses stay the same (`https://thepatientscompass.com/api/stripe/webhook` and `/api/shopify/webhook`), so nothing changes on Stripe or Shopify. Only copy the signing secret:

- **Stripe** → *Developers* → *Webhooks* → your endpoint → *Signing secret* → *Reveal* → add it to Cloudflare as secret `STRIPE_WEBHOOK_SECRET`.
- If the endpoint doesn't exist yet, *Add endpoint* with the URL above and events `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.

## 9. Check, then retire Manus

Visit the home page, books, blog, a blog post, the Health Companion, the Lab Analyzer, sign in, and the admin dashboard. When **/admin/migration** shows "all done" for files and your data is there, you can unpublish the Manus project. After that, delete the `LEGACY_ASSET_ORIGIN` line in `wrangler.jsonc` so the hourly job stops looking for the old site.

---

### If something goes wrong

- **"Couldn't reach the AI service" / AI answers fail** — check `ANTHROPIC_API_KEY`. If Anthropic retired the model, add a Text variable `ANTHROPIC_MODEL` with a current model name (e.g. `claude-sonnet-5-5`).
- **Verification emails don't arrive** — check `RESEND_API_KEY` and that the domain is verified in Resend.
- **Live logs** — Worker → *Observability* / *Logs* shows every request and error.
- **Undo the domain move** — remove the custom domains from the Worker and point the DNS records back to Manus; the Manus project keeps working until you unpublish it.
