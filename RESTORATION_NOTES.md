# Patients Compass Restoration Notes

## Restoration Status

The supplied archive has been restored into this project workspace with its React client, responsive health-navigation pages, server and tRPC implementation, authentication paths, dashboards, informational content, account and billing views, and Drizzle migration history. The managed database now contains the archived data model. The source archive remains preserved in the provided upload, and its original checklist is retained in `ARCHIVED_TODO.md`.

## Validation Results

| Validation area | Result | Notes |
| --- | --- | --- |
| Dependency installation | Passed | The archived lockfile installed successfully. |
| Type checking | Passed | `pnpm check` completed without TypeScript errors. |
| Automated tests | Passed | 238 tests passed. Twenty-nine archived checks remain intentionally skipped because they exercise the retired direct-profile social-login contract; the live token-verified Google and Apple paths have focused coverage. |
| Production build | Passed | `pnpm build` completed and produced the server and browser bundles. |
| Managed database | Passed | The restored schema is present and the Drizzle journal includes the archive history plus a non-destructive compatibility migration for `email_automation.emailPreferences`. |
| Responsive preview | Passed | Landing, dashboard, pricing, and signup states rendered in the desktop preview; the enhanced dashboard also rendered cleanly at a 375-pixel mobile viewport. |

The restored preview logs a non-blocking warning for the optional `VITE_PLAUSIBLE_DOMAIN` analytics setting. This does not affect the core health-navigation experience. Configure Plausible only if analytics tracking is required.

## Stripe Configuration Status

The preserved checkout and subscription routes use the configured Stripe integration. The current source creates subscription Checkout sessions through the server and uses the raw-body webhook endpoint at `POST /api/stripe/webhook`. The webhook verifies Stripe signatures before handling events, and setup verification events with IDs beginning `evt_test_` are acknowledged without changing application data. Stripe requires a publicly accessible HTTPS endpoint for registered webhooks and signature verification using the unmodified request body, `Stripe-Signature` header, and endpoint secret. [1] [2]

| Configuration item | Current restoration state | Action needed before accepting production payments |
| --- | --- | --- |
| Stripe account sandbox | A project sandbox was created during restoration. | Claim the sandbox from the project’s Stripe invitation before its expiry date, then confirm access to its dashboard. |
| Server and browser Stripe keys | Managed by the project’s Stripe integration. | Do not place secret values in source control. If key configuration needs attention, use the project payment settings. |
| Monthly and yearly price IDs | Configured and validated against the sandbox for $9.00 monthly and $99.99 yearly recurring Prices. | No further action is required unless the billing catalog changes. |
| Webhook route | Restored at `/api/stripe/webhook`, before JSON body parsing. | Register the deployed HTTPS URL in Stripe and subscribe it to `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, and `customer.subscription.deleted`. |
| Webhook signing secret | Supplied by the Stripe integration for the registered endpoint. | Confirm the endpoint secret corresponds to the deployed endpoint, not a separate local CLI listener. [2] |
| Stripe Customer Portal | The archived billing flow can create portal sessions for a stored Stripe customer. | Configure the portal in Stripe before exposing customer self-service billing management. |

## Integration Configuration Update

The Stripe sandbox now contains **The Patient's Compass Pro** with a recurring monthly Price of **$9.00** and a recurring yearly Price of **$99.99**. The project environment is configured with both generated `price_...` identifiers, and the restored Stripe configuration tests resolve both Prices successfully against the sandbox.

Google Identity Services is configured with the Patients Compass Web Client ID. The following origins are registered on the Google OAuth client, as required for browser-based Google Identity Services: [3]

| Google authorized JavaScript origin | Purpose |
| --- | --- |
| `https://thepatientscompass.com` | Production apex domain |
| `https://www.thepatientscompass.com` | Production `www` domain |
| `https://patientsapp-ekwl3omj.manus.space` | Managed deployment domain |

The restored server now validates the Google credential as an **ID token** using Google's token-information endpoint and checks the token audience, expiration, and verified-email claim. Apple ID tokens are cryptographically verified against Apple's published JSON Web Key Set before account data can be accepted.

### Deferred Sign in with Apple Setup

Apple sign-in remains intentionally disabled because the owner does not yet have the required Apple Developer Program setup. Apple requires a Sign in with Apple-enabled primary App ID, an associated Services ID for the website, and a Sign in with Apple private-key identifier. Website domains and absolute return URLs must be registered against that Services ID. [4] [5]

When an active Apple Developer Program membership is available, complete the following provider-side configuration:

| Apple setting | Required value or action |
| --- | --- |
| Primary App ID | Create or select an App ID and enable the **Sign in with Apple** capability. |
| Services ID | Create a unique web Services ID, such as `com.thepatientscompass.web`, and associate it with the primary App ID. |
| Domains | Register `thepatientscompass.com`, `www.thepatientscompass.com`, and `patientsapp-ekwl3omj.manus.space`. |
| Return URLs | Register `https://thepatientscompass.com/auth/apple/callback`, `https://www.thepatientscompass.com/auth/apple/callback`, and `https://patientsapp-ekwl3omj.manus.space/auth/apple/callback`. |
| Team ID | Add the Apple Developer Team ID as `VITE_APPLE_TEAM_ID`. |
| Key ID | Create a Sign in with Apple private key and add its identifier as `VITE_APPLE_KEY_ID`. Keep the downloaded private key restricted to the Apple Developer team. |
| Services ID value | Add the Services ID as `VITE_APPLE_SERVICE_ID`. |

Until these identifiers exist, the signup page presents Apple sign-in as unavailable rather than allowing a failing authentication attempt.

> The archived checkout implementation retains its current monthly and yearly plan IDs as configuration rather than hard-coding prices. This preserves the source design and allows the billing catalog to be managed in Stripe.

## Additional Environment Requirements

The central application flow can run with the project’s managed authentication, database, storage, mapping, and built-in service variables. Some preserved optional capabilities require separate configuration before those specific flows can operate in production.

| Capability | Required configuration | Effect when not configured |
| --- | --- | --- |
| Transactional and lifecycle email | `RESEND_API_KEY` | Welcome, billing, subscription, and automation emails are not delivered. |
| Google social sign-in | `VITE_GOOGLE_CLIENT_ID` | Google login remains unavailable. |
| Apple social sign-in | `VITE_APPLE_SERVICE_ID`, `VITE_APPLE_TEAM_ID`, and `VITE_APPLE_KEY_ID` | Apple login remains unavailable. |
| Analytics | `VITE_PLAUSIBLE_DOMAIN` and the corresponding Plausible setup | Analytics tracking is inactive. |
| Public webhook delivery and scheduled work | A published project URL | Stripe and scheduled endpoints cannot receive production traffic until the project is published. |

## Recommended Activation Sequence

Claim the Stripe sandbox, create or confirm the two recurring Prices, and configure their IDs securely. Next, publish the restored project, register the public webhook URL, and use Stripe’s test dashboard or CLI to send signed events to the webhook. Finally, validate a monthly and yearly Checkout session, the completion redirect, subscription status updates, the Customer Portal, and cancellation handling. Stripe recommends testing the endpoint before going live. [1]

## References

[1]: https://docs.stripe.com/webhooks "Stripe — Receive Stripe events in your webhook endpoint"
[2]: https://docs.stripe.com/webhooks/signature "Stripe — Resolve webhook signature verification errors"
[3]: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid "Google Identity Services — Get a client ID"
[4]: https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/ "Apple Developer — Configure Sign in with Apple for the web"
[5]: https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple "Apple Developer — Configuring your environment for Sign in with Apple"
