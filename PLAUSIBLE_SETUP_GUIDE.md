# Plausible Analytics Setup Guide

Complete guide for setting up Plausible analytics on The Patient's Compass.

## Current Status

- ✅ Plausible script added to `client/index.html`
- ✅ Domain configured: `thepatientscompass.com`
- ✅ Analytics tracking active on all pages

## Getting Started

### Step 1: Create Plausible Account

1. Visit: https://plausible.io
2. Click "Start free trial"
3. Sign up with your email
4. Verify your email

### Step 2: Add Your Domain

1. Log in to Plausible dashboard
2. Click "New Site"
3. Enter domain: **thepatientscompass.com**
4. Select timezone: **Your timezone**
5. Click "Add site"

### Step 3: Verify Domain Ownership

Plausible will ask you to add a DNS record or verify via HTML. Choose one:

**Option A: DNS Record (Recommended)**
1. Copy the CNAME record Plausible provides
2. Add it to your GoDaddy DNS settings
3. Wait for propagation (5-15 minutes)
4. Click "Verify" in Plausible

**Option B: HTML Meta Tag**
1. Copy the meta tag
2. Add to `client/index.html` in `<head>`
3. Deploy your site
4. Click "Verify" in Plausible

### Step 4: Start Tracking

Once verified, Plausible will automatically track:
- ✅ Page views
- ✅ Unique visitors
- ✅ Session duration
- ✅ Bounce rate
- ✅ Traffic sources
- ✅ Device types
- ✅ Geographic location

## Setting Up Goals

Goals track specific user actions. Set up these goals:

### Goal 1: Sign-In Attempt
- **Name:** Sign-In Attempt
- **Trigger:** Page visit to `/signin` or `/dev/signin`
- **Value:** Track conversion rate

### Goal 2: Book View
- **Name:** Book View
- **Trigger:** Page visit to `/books` or `/biomarkers`
- **Value:** Track content engagement

### Goal 3: AI Assistant Usage
- **Name:** AI Assistant Usage
- **Trigger:** Page visit to `/medical-assistant`
- **Value:** Track feature adoption

### Goal 4: Waitlist Signup
- **Name:** Waitlist Signup
- **Trigger:** Custom event `waitlist_signup`
- **Value:** Track lead generation

### Goal 5: Dashboard Access
- **Name:** Dashboard Access
- **Trigger:** Page visit to `/dashboard`
- **Value:** Track user retention

**To add goals:**
1. Go to Plausible dashboard
2. Click "Settings" → "Goals"
3. Click "Add Goal"
4. Enter goal name and trigger
5. Click "Add Goal"

## Custom Events

To track specific user actions, add custom events in your code:

### Example: Track Waitlist Signup

In `client/src/pages/Home.tsx`:
```typescript
const handleWaitlistSignup = async (email: string) => {
  // Track event
  if (window.plausible) {
    window.plausible('waitlist_signup', { props: { email_domain: email.split('@')[1] } });
  }
  
  // Your signup logic
  await subscribeEmail(email);
};
```

### Example: Track Book Purchase

In `client/src/pages/Books.tsx`:
```typescript
const handleBuyBook = (bookId: string, title: string) => {
  // Track event
  if (window.plausible) {
    window.plausible('book_purchase', { props: { book_id: bookId, title } });
  }
  
  // Your purchase logic
};
```

## Viewing Analytics

### Real-Time Dashboard
- Shows live visitors and page views
- Updates every few seconds
- Great for monitoring during launches

### Detailed Reports
- Click any metric to drill down
- Filter by date range, device, location, etc.
- Export data as CSV

### Traffic Sources
- See where visitors come from
- Organic search, direct, referrals, etc.
- Identify top-performing channels

### Geographic Data
- See visitor locations
- Identify target markets
- Plan localization efforts

## Advanced Features

### Email Reports
1. Go to Settings → Email Reports
2. Choose frequency (weekly, monthly)
3. Select metrics to include
4. Get automated reports in your inbox

### Integrations
1. Go to Settings → Integrations
2. Connect to Slack, Discord, etc.
3. Get notifications on key metrics

### Custom Properties
Track additional data with custom properties:

```typescript
// Track user properties
window.plausible('pageview', {
  props: {
    user_type: 'premium',
    subscription_status: 'active',
    lab_tests_completed: 5
  }
});
```

## Privacy Features

Plausible is privacy-first:
- ✅ No cookies (GDPR compliant)
- ✅ No personal data collection
- ✅ No third-party tracking
- ✅ No consent banner needed

## Troubleshooting

### Analytics Not Showing Data

1. **Verify script is loaded**
   - Open DevTools (F12)
   - Go to Network tab
   - Reload page
   - Look for `plausible.js` request
   - Should return 200 status

2. **Check domain in Plausible**
   - Make sure domain matches exactly
   - Should be `thepatientscompass.com` (not `www.`)

3. **Wait for data**
   - Plausible may take 5-10 minutes to show first data
   - Refresh dashboard after waiting

4. **Check for ad blockers**
   - Some ad blockers block Plausible
   - Disable temporarily to test

### Goals Not Tracking

1. **Verify goal trigger**
   - Check that page path matches exactly
   - Use `/books` not `/books/`

2. **Test custom events**
   - Open DevTools console
   - Run: `window.plausible('test_event')`
   - Should see event in Plausible within 1 minute

3. **Check event name**
   - Event names are case-sensitive
   - Use lowercase with underscores

## Best Practices

1. **Set realistic goals** — Focus on key metrics that matter
2. **Monitor regularly** — Check dashboard weekly
3. **Track campaigns** — Use UTM parameters for marketing
4. **Analyze trends** — Look for patterns in user behavior
5. **Act on insights** — Use data to improve UX

## Example: UTM Parameters

Track marketing campaigns:

```
https://thepatientscompass.com?utm_source=email&utm_medium=newsletter&utm_campaign=launch
https://thepatientscompass.com?utm_source=facebook&utm_medium=social&utm_campaign=awareness
```

Plausible will automatically track these and show them in "Traffic Sources".

## Support

- Plausible Docs: https://plausible.io/docs
- Email Support: support@plausible.io
- Community: https://twitter.com/plausiblehq
