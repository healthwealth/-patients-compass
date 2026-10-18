# Growth Acceleration Features

This document outlines the three major growth features implemented for The Patient's Compass: Email Automation, Referral Program, and Analytics Dashboard.

---

## 1. Email Automation

### Overview

Email automation sends targeted emails at key moments in the user journey:
- **Trial Expiration Email** (1 day before trial ends)
- **Onboarding Sequence** (Days 1, 3, 5 after signup)

### Database Schema

**Table: `email_automation`**
- Tracks email delivery status for each user
- Stores Heartbeat cron task UIDs for scheduled jobs
- Records email open/send timestamps

### Implementation

#### Backend Components

**File: `server/db.emailAutomation.ts`**
- `initializeEmailAutomation(userId)` - Create automation record for new user
- `getEmailAutomationStatus(userId)` - Get email delivery status
- `markTrialExpirationEmailSent(userId)` - Mark trial email as sent
- `markOnboardingEmailSent(userId, emailNumber)` - Mark onboarding email as sent
- `scheduleTrialExpirationEmail(userId, cronTaskUid)` - Link Heartbeat cron
- `getUsersNeedingTrialExpirationEmails()` - Get users for trial email batch
- `getUsersNeedingOnboardingEmails()` - Get users for onboarding batch

**File: `server/handlers/emailAutomationHandlers.ts`**
- `handleTrialExpirationEmails(req, res)` - Heartbeat handler for trial emails
- `handleOnboardingEmails(req, res)` - Heartbeat handler for onboarding sequence

#### Email Templates

Three onboarding emails are sent automatically:

1. **Day 1 - Welcome Email**
   - Introduces The Patient's Compass
   - Guides users to key features (books, biomarkers, AI assistant)
   - Encourages exploration during trial

2. **Day 3 - Social Proof Email**
   - Shares success stories from other users
   - Highlights biomarker improvements
   - Provides next steps

3. **Day 5 - Upgrade Email**
   - Explains Pro vs Free features
   - Shows feature comparison table
   - Includes 30-day money-back guarantee

**Trial Expiration Email**
- Sent 1 day before trial ends
- Emphasizes what users will lose (unlimited AI queries, etc.)
- Includes special promo code (TRIAL30 for 30% off)
- Includes upgrade CTA

### Setting Up Heartbeat Cron Jobs

After deploying to production, create two Heartbeat cron jobs:

#### Trial Expiration Email Job

```bash
manus-heartbeat create \
  --name trial-expiration-emails \
  --cron "0 9 * * *" \
  --path /api/scheduled/trial-expiration-emails \
  --description "Send trial expiration emails 1 day before trial ends"
```

#### Onboarding Email Job

```bash
manus-heartbeat create \
  --name onboarding-emails \
  --cron "0 9 * * *" \
  --path /api/scheduled/onboarding-emails \
  --description "Send onboarding sequence on days 1, 3, 5"
```

### Registering Handlers

In `server/_core/index.ts`, register the handlers:

```typescript
app.post("/api/scheduled/trial-expiration-emails", handleTrialExpirationEmails);
app.post("/api/scheduled/onboarding-emails", handleOnboardingEmails);
```

---

## 2. Referral Program

### Overview

The referral program incentivizes users to invite friends:
- Users earn **$10 credit** per successful referral
- Referral codes expire after **90 days**
- Credits can be applied to subscription payments

### Database Schema

**Table: `referrals`**
- `referrerId` - User who created the referral code
- `referredUserId` - User who signed up via referral
- `referralCode` - Unique code (12 alphanumeric characters)
- `status` - pending | converted | expired
- `creditAmount` - $10 in cents (1000)
- `creditApplied` - Whether credit was applied to referrer's account
- `expiresAt` - 90 days from creation

### Implementation

#### Backend Components

**File: `server/db.referrals.ts`**
- `createReferralCode(userId)` - Generate new referral code
- `getUserReferralCode(userId)` - Get user's active referral code
- `trackReferral(referralCode, newUserId)` - Mark referral as converted
- `getReferralEarnings(userId)` - Get total earnings and pending credits
- `getReferralHistory(userId)` - Get all referrals for a user
- `applyReferralCredits(referralId)` - Apply pending credits to account
- `getReferralStats()` - Get program-wide statistics

**File: `server/routers/referral.ts`**
- `getOrCreateCode` - Get or create referral code for current user
- `getEarnings` - Get referral earnings
- `getHistory` - Get referral history
- `trackSignup` - Track new user signup via referral code

#### Frontend Integration

1. **Referral Link Generation**
   ```
   https://thepatientscompass.com?ref=ABC123XYZ456
   ```

2. **Signup Flow**
   - Check for `ref` parameter in URL
   - Call `referral.trackSignup` with referral code
   - Award $10 credit to referrer

3. **Referral Dashboard**
   - Display user's referral code
   - Show earnings (total, applied, pending)
   - Show referral history with status

### Revenue Impact

- Reduces customer acquisition cost
- Increases viral coefficient (each user brings new users)
- Expected impact: 20-30% increase in new user signups

---

## 3. Analytics Dashboard

### Overview

Admin-only dashboard for tracking:
- **User Metrics** - Total users, active users, new signups
- **Trial Metrics** - Active trials, conversion rate
- **Subscription Metrics** - MRR, ARR, churn rate
- **Email Metrics** - Send rates, open rates
- **Referral Metrics** - Referrals, conversions, credits issued
- **Revenue Metrics** - Total revenue, average order value

### Database Schema

**Table: `analytics_snapshots`**
- Daily snapshot of all metrics
- Captures point-in-time data for trend analysis
- Allows historical comparison

### Implementation

#### Backend Components

**File: `server/db.analytics.ts`**
- `createDailySnapshot()` - Create daily metrics snapshot
- `getAnalyticsForDateRange(startDate, endDate)` - Get snapshots for date range
- `getLatestSnapshot()` - Get most recent snapshot
- `getConversionMetrics()` - Calculate conversion rates
- `getRevenueMetrics()` - Calculate MRR, ARR, revenue
- `getUserGrowthMetrics()` - Get user growth data

**File: `server/routers/analytics.ts`**
- `getLatestSnapshot` - Get latest metrics
- `getDateRange` - Get metrics for date range
- `getConversionMetrics` - Get conversion metrics
- `getRevenueMetrics` - Get revenue metrics
- `getUserGrowthMetrics` - Get user growth metrics
- `getDashboard` - Get all metrics (admin only)

#### Key Metrics

| Metric | Formula | Importance |
|--------|---------|-----------|
| Trial-to-Pro Conversion | (Users converted / Users with trial) × 100 | Measures trial effectiveness |
| Free-to-Pro Conversion | (Pro users / Free users) × 100 | Measures upgrade effectiveness |
| Referral Conversion | (Converted referrals / Total referrals) × 100 | Measures referral quality |
| MRR | (Active subscriptions × $9.99) | Monthly recurring revenue |
| ARR | MRR × 12 | Annual recurring revenue |
| Churn Rate | (Canceled subscriptions / Active subscriptions) × 100 | User retention |
| CAC (Customer Acquisition Cost) | Total marketing spend / New customers | Cost efficiency |

### Setting Up Daily Snapshot

Create a Heartbeat cron job to capture daily metrics:

```bash
manus-heartbeat create \
  --name daily-analytics-snapshot \
  --cron "0 0 * * *" \
  --path /api/scheduled/daily-analytics \
  --description "Capture daily analytics snapshot at midnight UTC"
```

### Accessing the Dashboard

Admin users can access the analytics dashboard at:
```
/admin/analytics
```

The dashboard displays:
- Real-time metrics
- Historical trends (7-day, 30-day, 90-day)
- Conversion funnel
- Revenue breakdown
- User growth chart
- Referral program performance

---

## Deployment Checklist

Before going live with these features:

- [ ] Database migrations applied (`email_automation`, `referrals`, `analytics_snapshots`)
- [ ] Email service configured (RESEND_API_KEY, RESEND_SENDER_EMAIL)
- [ ] Heartbeat cron jobs created (trial emails, onboarding emails, daily snapshot)
- [ ] Email handlers registered in Express
- [ ] Frontend components built (referral dashboard, analytics dashboard)
- [ ] Admin routes protected (admin-only access)
- [ ] Email templates tested with real Resend account
- [ ] Referral tracking integrated into signup flow
- [ ] Analytics dashboard tested with sample data
- [ ] Checkpoint saved and deployed to production

---

## Expected Impact

### Email Automation
- **Trial-to-Pro Conversion**: +40-50% (from onboarding sequence + trial expiration email)
- **Engagement**: +60% (users see key features in onboarding emails)
- **Revenue**: +$500-1000/month (assuming 50 trial users/month)

### Referral Program
- **New User Acquisition**: +20-30% (viral growth)
- **CAC Reduction**: -30% (referrals cost less than paid ads)
- **Lifetime Value**: +50% (referred users have higher LTV)

### Analytics Dashboard
- **Data-Driven Decisions**: Enable optimization based on real metrics
- **Early Warning System**: Identify churn, conversion drops early
- **Performance Tracking**: Monitor impact of changes

---

## Monitoring & Optimization

### Weekly Tasks
- Review conversion metrics
- Check email delivery rates
- Monitor referral program performance
- Analyze user growth trends

### Monthly Tasks
- Review MRR and ARR
- Calculate customer acquisition cost
- Analyze churn rate
- Optimize email content based on open rates

### Quarterly Tasks
- Review overall strategy
- Plan feature releases based on user feedback
- Adjust pricing/offers based on metrics
- Plan next growth initiatives

---

## Troubleshooting

### Emails Not Sending
1. Check RESEND_API_KEY is set
2. Verify RESEND_SENDER_EMAIL is configured
3. Check email_automation table for records
4. Review Resend dashboard for bounce/delivery errors

### Referral Code Not Tracking
1. Verify referral code exists in database
2. Check that `trackSignup` is called in signup flow
3. Verify referral code hasn't expired
4. Check referrals table for conversion status

### Analytics Not Updating
1. Verify daily snapshot cron job is running
2. Check analytics_snapshots table for records
3. Review cron job logs for errors
4. Verify admin user role is set correctly

---

## Future Enhancements

- Affiliate program with higher commission tiers
- Email preference center (users control frequency)
- Advanced segmentation (send different emails based on user behavior)
- A/B testing framework for email optimization
- Revenue attribution (track which referrals generated revenue)
- Custom analytics reports (export to CSV/PDF)
- Real-time dashboard updates (WebSocket)
- Predictive churn modeling (identify at-risk users)
