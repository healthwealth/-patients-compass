# Integration Setup Guide — The Patient's Compass

This document covers the setup and usage of three new integrations added to The Patient's Compass in June 2026:

1. **Admin Access Bypass** — Development access to admin features
2. **Resend Email Service** — Transactional email delivery
3. **Plausible Analytics** — Privacy-friendly traffic tracking

---

## 1. Admin Access Bypass (Development Only)

### Purpose
Provides a way to access admin features during development when OAuth is unavailable or for testing purposes.

### How It Works
- **Endpoint:** `POST /api/dev/admin-bypass` (development only)
- **Availability:** Development mode only (`NODE_ENV !== 'production'`)
- **Creates:** A test admin user with role `admin`
- **Sets:** A session cookie for immediate access

### Usage

#### Option A: Using the Endpoint Directly
```bash
curl -X POST http://localhost:3000/api/dev/admin-bypass
```

Response:
```json
{
  "success": true,
  "message": "Admin session created",
  "user": {
    "openId": "dev-admin-test",
    "email": "admin@test.local",
    "role": "admin"
  }
}
```

#### Option B: Using the Seeding Script
```bash
cd /path/to/project
pnpm node scripts/seed-admin.mjs
```

This creates a test admin user in the database with a unique `openId` for manual session creation.

### Admin Features Available
- `/admin/waitlist` — View and manage email waitlist
- `trpc.email.waitlistEntries` — Fetch all waitlist subscribers
- `trpc.email.notifyAllWaitlist` — Send bulk re-engagement emails

---

## 2. Resend Email Service

### Purpose
Sends transactional emails for:
- Waitlist confirmation emails (when users join the sign-in waitlist)
- Re-engagement emails (when sign-in is restored)

### Setup

#### Step 1: Get Resend API Key
1. Sign up at https://resend.com (free tier available)
2. Navigate to API Keys in your dashboard
3. Create a new API key
4. Copy the key (format: `re_...`)

#### Step 2: Set Environment Variable
The API key has already been requested via `webdev_request_secrets`. If you need to update it:

```bash
# Via Manus UI: Settings → Secrets
# Or via environment variable:
export RESEND_API_KEY="re_your_api_key_here"
```

### Email Templates

#### Waitlist Confirmation Email
Sent when a user joins the sign-in waitlist.

**Trigger:** `trpc.email.joinWaitlist` (new entry only)

**Template:** `server/_core/email.ts` → `sendWaitlistConfirmation()`

**Content:**
- Welcome message
- Explanation of maintenance
- Links to available features (Biomarker Directory, Lifestyle AI, Books)

#### Re-Engagement Email
Sent when admin triggers bulk re-engagement.

**Trigger:** `trpc.email.notifyAllWaitlist` (admin only)

**Template:** `server/_core/email.ts` → `sendReEngagementEmail()`

**Content:**
- "Sign-in is back online!" announcement
- List of newly available features
- Call-to-action button to sign in

### Testing Email Delivery

#### Local Testing
1. Start dev server: `pnpm dev`
2. Join waitlist: Visit `/signin` and submit email
3. Check Resend dashboard for delivery status

#### Admin Bulk Send
1. Access admin panel: `POST /api/dev/admin-bypass`
2. Navigate to `/admin/waitlist`
3. Click "Notify All Waitlist" button
4. Check Resend dashboard for delivery status

### Troubleshooting

**"API key is invalid"**
- Verify `RESEND_API_KEY` is set correctly
- Check key format (should start with `re_`)
- Regenerate key in Resend dashboard if needed

**Emails not sending**
- Check Resend dashboard for bounce/error logs
- Verify sender email is verified in Resend
- Check console logs for error messages

**Rate Limiting**
- Resend allows 100 emails/second on free tier
- Bulk send includes 100ms delay between emails to avoid limits

---

## 3. Plausible Analytics

### Purpose
Tracks website traffic and user behavior with privacy-friendly analytics.

### Setup

#### Step 1: Create Plausible Account
1. Sign up at https://plausible.io (free 30-day trial)
2. Create a new site
3. Copy your domain name (e.g., `thepatientscompass.com`)

#### Step 2: Set Environment Variable
The domain has already been requested via `webdev_request_secrets`. If you need to update it:

```bash
# Via Manus UI: Settings → Secrets
# Or via environment variable:
export VITE_PLAUSIBLE_DOMAIN="thepatientscompass.com"
```

#### Step 3: Verify Integration
1. Start dev server: `pnpm dev`
2. Open browser DevTools (F12)
3. Go to Network tab
4. Look for requests to `plausible.io/js/script.js`
5. Visit Plausible dashboard to see real-time traffic

### Tracked Events

#### Automatic Tracking
Plausible automatically tracks:
- Page views
- Referrers
- Device type
- Geographic location
- Browser/OS

#### Custom Events (Optional)
To track specific actions, add to components:

```typescript
// Track button clicks
const handleClick = () => {
  if (window.plausible) {
    window.plausible('button_click', { props: { button_name: 'sign_in' } });
  }
};

// Track form submissions
const handleSubmit = () => {
  if (window.plausible) {
    window.plausible('form_submit', { props: { form_name: 'waitlist' } });
  }
};
```

### Viewing Analytics

1. Log in to Plausible dashboard
2. Select your site
3. View real-time traffic, top pages, referrers, etc.
4. Set up custom goals for conversions

### Privacy Features

Plausible is GDPR/CCPA compliant and does NOT:
- Use cookies
- Collect personal data
- Require cookie consent banner (optional)
- Share data with third parties

---

## Integration Testing

### Run Tests
```bash
pnpm test
```

### Specific Test Files
```bash
# Email service tests
pnpm test server/_core/email.test.ts

# Waitlist email tests
pnpm test server/email.waitlist.test.ts

# Lab/email router tests
pnpm test server/lab.test.ts
```

### Expected Results
- ✅ Email service: 7/7 tests passing
- ✅ Waitlist integration: 3/3 tests passing
- ✅ Lab router: 11/11 tests passing (includes email)

---

## Deployment Checklist

Before deploying to production:

- [ ] Resend API key is set in production environment
- [ ] Plausible domain is configured
- [ ] Admin bypass is disabled (only available in dev mode)
- [ ] Email templates are reviewed and tested
- [ ] Analytics dashboard is set up and verified
- [ ] All tests pass: `pnpm test`
- [ ] Checkpoint created: `webdev_save_checkpoint`

---

## OAuth Restoration

When Manus OAuth service is restored:

1. **Sign-in will work automatically** — No code changes needed
2. **Maintenance banner will show** — Update `VITE_SHOW_MAINTENANCE_BANNER=false` to hide
3. **Admin bypass can be removed** — Optional, doesn't interfere with OAuth
4. **Re-engagement emails** — Send to waitlist when sign-in is back online

---

## Support & Troubleshooting

### Common Issues

**Email not sending**
- Check Resend API key is valid
- Verify sender email is verified in Resend
- Check console logs for errors

**Analytics not tracking**
- Verify `VITE_PLAUSIBLE_DOMAIN` is set
- Check browser DevTools Network tab
- Ensure Plausible script is loaded

**Admin bypass not working**
- Only available in development mode
- Check `NODE_ENV !== 'production'`
- Verify endpoint: `POST /api/dev/admin-bypass`

### Getting Help

- **Resend Support:** https://resend.com/support
- **Plausible Support:** https://plausible.io/support
- **Manus Docs:** https://help.manus.im

---

## File References

### New Files Created
- `server/_core/email.ts` — Email service helper
- `server/_core/email.test.ts` — Email service tests
- `server/_core/adminBypass.ts` — Admin bypass endpoint
- `scripts/seed-admin.mjs` — Admin user seeding script
- `INTEGRATION_SETUP.md` — This file

### Modified Files
- `server/_core/env.ts` — Added `resendApiKey`, `plausibleDomain`
- `server/_core/index.ts` — Registered admin bypass route
- `server/routers/lab.ts` — Updated email router with Resend
- `client/index.html` — Switched to Plausible analytics
- `todo.md` — Updated task tracking

---

## Next Steps

1. **Test OAuth** — When Manus platform is restored, test sign-in flow
2. **Monitor Analytics** — Set up Plausible goals and dashboards
3. **Email Campaigns** — Plan re-engagement email timing
4. **Deploy** — Push changes to production when ready

---

**Last Updated:** June 3, 2026  
**Version:** 1.0  
**Status:** Ready for testing
