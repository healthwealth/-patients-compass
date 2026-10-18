# Heartbeat Email Automation Setup

This document describes the automated email system powering The Patient's Compass user engagement and retention.

## Overview

The Patient's Compass uses **Heartbeat cron jobs** to send automated emails on a schedule. These jobs run independently of the application and trigger HTTP callbacks to your deployed site.

**Key Benefits:**
- Survives application restarts and sandbox hibernation
- Scales automatically with your user base
- Managed entirely by the Manus platform
- No in-process timers or background workers needed

## Configured Email Campaigns

### 1. Onboarding Sequence (Daily)

**Schedule:** Every day at 09:00 UTC  
**Task UID:** `4Z92Y5UJDhWCVvvRcKrWUn`  
**Endpoint:** `/api/scheduled/onboarding`

Sends a 3-email sequence to new users over 7 days:
- **Email 1 (Day 1):** Welcome + Popular Books
- **Email 2 (Day 3):** Biomarker Guides Deep Dive
- **Email 3 (Day 5):** AI Assistant + Lab Analysis

**Database Table:** `email_automation`  
**Tracking Fields:**
- `onboardingEmail1Sent`, `onboardingEmail1SentAt`, `onboardingEmail1Opened`
- `onboardingEmail2Sent`, `onboardingEmail2SentAt`, `onboardingEmail2Opened`
- `onboardingEmail3Sent`, `onboardingEmail3SentAt`, `onboardingEmail3Opened`

### 2. Trial Expiration Reminders (Daily)

**Schedule:** Every day at 08:00 UTC  
**Task UID:** `FJjzxLsvWkueKahAUpgZ7h`  
**Endpoint:** `/api/scheduled/trial-expiration`

Sends reminder email 1 day before trial expires to users who haven't upgraded.

**Database Table:** `email_automation`  
**Tracking Fields:**
- `trialExpirationEmailScheduled`
- `trialExpirationEmailSent`
- `trialExpirationEmailSentAt`
- `trialExpirationEmailOpened`

### 3. Re-engagement Campaign (Weekly)

**Schedule:** Every Monday at 10:00 UTC  
**Task UID:** `9HjAjk3mHm9JKnYDGb3qte`  
**Endpoint:** `/api/scheduled/re-engagement`

Targets users who haven't logged in for 7+ days with personalized health insights.

**Database Table:** `email_automation`  
**Tracking Fields:**
- `reEngagementEmailSent`
- `reEngagementEmailSentAt`
- `reEngagementEmailOpened`

### 4. Weekly Digest (Weekly)

**Schedule:** Every Sunday at 09:00 UTC  
**Task UID:** `mQuCu9V7qqPWYpyfkZMjTQ`  
**Endpoint:** `/api/scheduled/weekly-digest`

Sends personalized health summary and recommendations to active users.

**Database Table:** `email_automation`  
**Tracking Fields:**
- `weeklyDigestEmailSent`
- `weeklyDigestEmailSentAt`
- `weeklyDigestEmailOpened`
- `emailPreferences` (JSON: `{ marketing, transactional, digests }`)

## Implementation Details

### Handler Functions

All handlers are located in:
- `server/handlers/emailScheduledHandlers.ts` - Trial expiration and onboarding
- `server/handlers/emailReEngagementHandlers.ts` - Re-engagement and weekly digest

### Email Service

Email functions are in `server/_core/emailService.ts`:
- `sendTrialExpirationEmail()`
- `sendOnboardingEmail1/2/3()`
- `sendReEngagementEmail()`
- `sendWeeklyDigestEmail()`

All emails include:
- Personalized greeting with user name
- Relevant content and CTAs
- "EDUCATIONAL CONTENT ONLY" footer
- Professional HTML styling

### Cron Authentication

Each handler authenticates via:
```typescript
const user = await sdk.authenticateRequest(req);
if (!user.isCron || !user.taskUid) {
  return res.status(403).json({ error: "cron-only" });
}
```

The `user.taskUid` is used to look up the job and prevent duplicate sends.

### Error Handling

All handlers:
1. Wrap logic in try/catch
2. Return 500 with error details on failure
3. Return 200 with success count on completion
4. Are idempotent (safe to retry)

## Managing Cron Jobs

### View All Jobs

```bash
manus-heartbeat list
```

### View Job Logs

```bash
manus-heartbeat logs --task-uid <task_uid> --with-body
```

### Pause a Job

```bash
manus-heartbeat update --task-uid <task_uid> --enable=false
```

### Resume a Job

```bash
manus-heartbeat update --task-uid <task_uid> --enable=true
```

### Change Schedule

```bash
manus-heartbeat update --task-uid <task_uid> --cron "0 10 * * * *"
```

### Delete a Job

```bash
manus-heartbeat delete --task-uid <task_uid>
```

## Email Preferences

Users can control which emails they receive via the `emailPreferences` JSON field:

```json
{
  "marketing": true,
  "transactional": true,
  "digests": true
}
```

Handlers check preferences before sending (except transactional emails).

## Testing

Run email automation tests:

```bash
pnpm test -- emailReEngagement.test.ts --run
```

Tests verify:
- Cron authentication
- Database connection handling
- Error responses
- Handler structure

## Deployment Notes

**IMPORTANT:** Cron jobs only trigger on **deployed** sites. They do not work in development.

Before any changes to handlers:
1. Save a checkpoint
2. Deploy the site
3. Create/update cron jobs
4. Monitor execution logs

## Troubleshooting

### Emails Not Sending

1. Check job is enabled: `manus-heartbeat list`
2. Check logs: `manus-heartbeat logs --task-uid <uid> --with-body`
3. Verify Resend API key is configured
4. Check email preferences in database

### Duplicate Emails

1. Check database for duplicate `emailAutomation` records
2. Verify handler idempotency (checks for existing sends)
3. Review job execution logs

### Job Not Triggering

1. Verify site is deployed (not in development)
2. Check job is enabled: `manus-heartbeat list`
3. Verify endpoint is mounted: `/api/scheduled/<name>`
4. Check server logs for 404 errors

## Future Enhancements

Potential additions:
- End-user-driven email schedules (tRPC mutations)
- A/B testing different email templates
- Dynamic content personalization
- Unsubscribe link tracking
- Email engagement analytics
- Automated cleanup of old automation records
