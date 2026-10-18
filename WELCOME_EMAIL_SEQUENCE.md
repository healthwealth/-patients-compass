# Welcome Email Sequence — Setup & Documentation

## Overview

The Patient's Compass now includes an automated 3-email welcome sequence for new sign-ups, delivered over 7 days using Manus Heartbeat cron jobs.

**Sequence Timeline:**
- **Email 1 (Day 0):** Welcome + Popular Books — Sent immediately after sign-up
- **Email 2 (Day 2):** Biomarker Guides Deep Dive — Sent 2 days after sign-up
- **Email 3 (Day 5):** AI Assistant + Lab Analysis — Sent 5 days after sign-up

---

## Architecture

### Database Schema

**Table: `email_sequences`**

Tracks the delivery status of each email in the sequence for every user.

```sql
CREATE TABLE `email_sequences` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL UNIQUE,
  `sequenceType` varchar(64) DEFAULT 'welcome',
  
  -- Email 1 tracking
  `email1Sent` tinyint DEFAULT 0,
  `email1SentAt` timestamp,
  `email1Opened` tinyint DEFAULT 0,
  
  -- Email 2 tracking
  `email2Sent` tinyint DEFAULT 0,
  `email2SentAt` timestamp,
  `email2Opened` tinyint DEFAULT 0,
  
  -- Email 3 tracking
  `email3Sent` tinyint DEFAULT 0,
  `email3SentAt` timestamp,
  `email3Opened` tinyint DEFAULT 0,
  
  `status` enum('pending','in_progress','completed','paused','failed'),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### File Structure

**Core Files:**

| File | Purpose |
|------|---------|
| `server/_core/welcomeEmailSequence.ts` | Email template definitions (3 templates) |
| `server/_core/emailScheduledHandlers.ts` | Heartbeat cron job handlers |
| `server/db.email-sequence.ts` | Database helper functions |
| `server/routers/emailSequence.ts` | tRPC router for admin setup |
| `drizzle/schema.ts` | Database schema definition |

---

## Setup Instructions

### Step 1: Database Migration

The `email_sequences` table has already been created. Verify it exists:

```bash
# Check if table exists
mysql -u root -p your_database -e "SHOW TABLES LIKE 'email_sequences';"
```

### Step 2: Deploy to Production

Before setting up scheduled emails, you **must** deploy the project:

1. Create a checkpoint: `webdev_save_checkpoint`
2. Click **Publish** in the Manus Management UI
3. Wait for deployment to complete

### Step 3: Initialize Scheduled Email Jobs

Once deployed, initialize the three Heartbeat cron jobs via tRPC:

**Option A: Using Admin Panel (Recommended)**

1. Sign in as admin
2. Navigate to Settings → Scheduled Tasks
3. Click "Initialize Welcome Emails"
4. Confirm the three jobs are created

**Option B: Using tRPC Directly**

```typescript
// Call from admin client
const result = await trpc.emailSequence.setupScheduledEmails.mutate();

// Response:
{
  success: true,
  jobs: [
    {
      name: "welcome-email-1",
      taskUid: "task_...",
      nextExecution: "2026-06-05T09:00:00Z"
    },
    {
      name: "welcome-email-2",
      taskUid: "task_...",
      nextExecution: "2026-06-05T10:00:00Z"
    },
    {
      name: "welcome-email-3",
      taskUid: "task_...",
      nextExecution: "2026-06-05T11:00:00Z"
    }
  ]
}
```

**Option C: Using CLI**

```bash
# Create Email 1 job
manus-heartbeat create \
  --name welcome-email-1 \
  --cron "0 9 * * * *" \
  --path /api/scheduled/email-1 \
  --description "Send welcome email 1 (Day 0) to new users"

# Create Email 2 job
manus-heartbeat create \
  --name welcome-email-2 \
  --cron "0 10 * * * *" \
  --path /api/scheduled/email-2 \
  --description "Send welcome email 2 (Day 2) to users"

# Create Email 3 job
manus-heartbeat create \
  --name welcome-email-3 \
  --cron "0 11 * * * *" \
  --path /api/scheduled/email-3 \
  --description "Send welcome email 3 (Day 5) to users"
```

---

## How It Works

### User Signup Flow

1. **User signs up** via OAuth callback
2. **OAuth handler** calls `upsertUser()` to create user record
3. **Email sequence initialized** — `createEmailSequence(userId)` creates entry in `email_sequences` table
4. **Status set to "pending"** — Ready for scheduled delivery

### Scheduled Email Delivery

**Email 1 (Day 0 - 9:00 UTC)**
- Heartbeat triggers `/api/scheduled/email-1`
- Handler fetches users created TODAY with `email1Sent = 0`
- Sends welcome email with popular books links
- Updates `email1Sent = 1` and `email1SentAt = now()`

**Email 2 (Day 2 - 10:00 UTC)**
- Heartbeat triggers `/api/scheduled/email-2`
- Handler fetches users created 2 DAYS AGO with `email2Sent = 0`
- Sends biomarker guides email
- Updates `email2Sent = 1` and `email2SentAt = now()`

**Email 3 (Day 5 - 11:00 UTC)**
- Heartbeat triggers `/api/scheduled/email-3`
- Handler fetches users created 5 DAYS AGO with `email3Sent = 0`
- Sends AI assistant email
- Updates `email3Sent = 1`, `email3SentAt = now()`, and `status = "completed"`

---

## Email Templates

### Email 1: Welcome + Popular Books

**Subject:** "Welcome to The Patient's Compass 🎯"

**Content:**
- Welcome message
- What users can do (analyze labs, explore biomarkers, get recommendations, chat with AI)
- Grid of 2 popular books with links
- Call-to-action buttons to browse all books
- Getting started steps (Symptom Quiz, AI Lab Scanner, Biomarker Library)

**Links:**
- Books catalog: `https://thepatientscompass.com/books`
- Symptom Quiz: `https://thepatientscompass.com/symptom-quiz`
- AI Lab Scanner: `https://thepatientscompass.com/ai-lab-scanner`
- Biomarker Library: `https://thepatientscompass.com/biomarker-library`

### Email 2: Biomarker Guides Deep Dive

**Subject:** "Understanding Your Biomarkers 📊"

**Content:**
- Education on core biomarkers (glucose, lipids, liver/kidney, inflammation)
- Links to detailed biomarker guides
- Call-to-action to upload lab results
- Featured books on optimal ranges and functional wellness
- Preview of next email

**Links:**
- Glucose guide: `https://thepatientscompass.com/biomarker-library/glucose`
- Lipids guide: `https://thepatientscompass.com/biomarker-library/lipids`
- Organ function: `https://thepatientscompass.com/biomarker-library/organ-function`
- Inflammation: `https://thepatientscompass.com/biomarker-library/inflammation`
- Lab scanner: `https://thepatientscompass.com/ai-lab-scanner`

### Email 3: AI Assistant + Lab Analysis

**Subject:** "Your AI Health Assistant is Ready 🤖"

**Content:**
- Introduction to AI Assistant capabilities
- Feature boxes: Ask health questions, analyze labs, get recommendations, learn from knowledge base
- Call-to-action to open AI Assistant
- Example questions users can ask
- Next steps (chat with AI, upload labs, create wellness plan, track progress)
- Exclusive offer for new members (10 free lab analyses)

**Links:**
- AI Assistant: `https://thepatientscompass.com/ai-assistant`
- Pricing: `https://thepatientscompass.com/pricing`

---

## Monitoring & Management

### View Scheduled Jobs

```bash
# List all scheduled jobs
manus-heartbeat list

# View execution history for email-1
manus-heartbeat logs --task-uid <task_uid> --with-body

# View failed executions
manus-heartbeat logs --task-uid <task_uid> --status failed
```

### Pause/Resume Emails

```bash
# Pause email 1 delivery
manus-heartbeat update --task-uid <task_uid> --enable=false

# Resume email 1 delivery
manus-heartbeat update --task-uid <task_uid> --enable=true
```

### Check User Email Status

```typescript
// Get email sequence status for a user
const status = await trpc.emailSequence.getSequenceStatus.query();

// Response:
{
  initialized: true,
  status: "in_progress",
  email1: { sent: true, sentAt: "2026-06-04T09:00:00Z", opened: false },
  email2: { sent: false, sentAt: null, opened: false },
  email3: { sent: false, sentAt: null, opened: false }
}
```

---

## Customization

### Change Email Timing

To send emails at different times, update the cron expressions:

```bash
# Send Email 1 at 8:00 UTC instead of 9:00
manus-heartbeat update --task-uid <task_uid> --cron "0 8 * * * *"

# Send Email 2 at 14:00 UTC instead of 10:00
manus-heartbeat update --task-uid <task_uid> --cron "0 14 * * * *"
```

### Customize Email Content

Edit templates in `server/_core/welcomeEmailSequence.ts`:

```typescript
// Example: Change Email 1 subject
export async function sendWelcomeEmail1(context: WelcomeEmailContext): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <!-- Your custom styles -->
    </head>
    <body>
      <!-- Your custom content -->
    </body>
    </html>
  `;

  return sendEmail({
    to: context.userEmail,
    subject: "Your Custom Subject Here",
    html,
  });
}
```

### Add More Emails to Sequence

To extend the sequence beyond 3 emails:

1. Add new columns to `email_sequences` table:
   ```sql
   ALTER TABLE email_sequences ADD COLUMN email4Sent tinyint DEFAULT 0;
   ALTER TABLE email_sequences ADD COLUMN email4SentAt timestamp;
   ```

2. Create new email template in `welcomeEmailSequence.ts`

3. Add handler in `emailScheduledHandlers.ts`

4. Register route in `server/_core/index.ts`

5. Create new Heartbeat job

---

## Troubleshooting

### Emails Not Sending

**Check 1: Verify Resend API Key**
```bash
echo $RESEND_API_KEY
# Should output: re_...
```

**Check 2: Verify Scheduled Jobs Exist**
```bash
manus-heartbeat list
# Should show welcome-email-1, welcome-email-2, welcome-email-3
```

**Check 3: Check Job Execution Logs**
```bash
manus-heartbeat logs --task-uid <task_uid> --with-body
```

**Check 4: Verify User Email Sequence Created**
```sql
SELECT * FROM email_sequences WHERE userId = 123;
```

### Emails Sent But Not Received

**Check Resend Dashboard:**
1. Log in to https://resend.com
2. Check delivery status for each email
3. Look for bounce/complaint logs

**Verify Sender Email:**
```bash
echo $RESEND_SENDER_EMAIL
# Should be: noreply@thepatientscompass.com
```

**Check Spam Folder:**
- Resend emails may be flagged as spam initially
- Add your domain to SPF/DKIM records to improve deliverability

### Jobs Running But Not Sending

**Check Database Connection:**
```sql
SELECT COUNT(*) FROM email_sequences;
```

**Check Handler Logs:**
```bash
manus-heartbeat logs --task-uid <task_uid> --with-body
```

**Verify Email Templates:**
- Ensure `sendWelcomeEmail1/2/3` functions are working
- Check for errors in `server/_core/welcomeEmailSequence.ts`

---

## Best Practices

1. **Test Before Production** — Send test emails to your own address first
2. **Monitor Delivery** — Check Resend dashboard daily for the first week
3. **Track Opens** — Use Resend's email tracking to monitor engagement
4. **Update Content** — Keep email templates fresh and relevant
5. **Segment Users** — Consider different sequences for different user types
6. **A/B Test** — Try different subject lines and content to optimize opens
7. **Unsubscribe Handling** — Implement unsubscribe links in all emails

---

## API Reference

### tRPC Procedures

#### `emailSequence.initializeWelcomeSequence`

Initialize welcome email sequence for current user (called automatically on signup).

```typescript
const result = await trpc.emailSequence.initializeWelcomeSequence.mutate();
// Returns: { success: true, message: "...", userId: 123 }
```

#### `emailSequence.getSequenceStatus`

Get email sequence status for current user.

```typescript
const status = await trpc.emailSequence.getSequenceStatus.query();
// Returns: { initialized: true, status: "in_progress", email1: {...}, email2: {...}, email3: {...} }
```

#### `emailSequence.setupScheduledEmails`

Create Heartbeat cron jobs for scheduled email delivery (admin only).

```typescript
const result = await trpc.emailSequence.setupScheduledEmails.mutate();
// Returns: { success: true, jobs: [...] }
```

### Database Functions

**`server/db.email-sequence.ts`**

- `createEmailSequence(userId)` — Create new sequence entry
- `getEmailSequence(userId)` — Get sequence for user
- `markEmailSent(userId, emailNumber)` — Mark email as sent
- `getUsersForEmail1/2/3()` — Get users ready for each email

---

## Performance Considerations

**Current Limits:**
- Processes up to 100 users per scheduled job run
- 100ms delay between emails to avoid rate limiting
- Batch processing to minimize database load

**Scaling:**
- For 10,000+ users, consider splitting jobs by user ID range
- Implement queue system (Bull, RabbitMQ) for higher volumes
- Add database indexes on `email1Sent`, `email2Sent`, `email3Sent`

---

## Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review Resend documentation: https://resend.com/docs
3. Review Manus Heartbeat documentation: `references/periodic-updates.md`
4. Contact support: https://help.manus.im

---

**Last Updated:** June 4, 2026  
**Version:** 1.0  
**Status:** Production Ready
