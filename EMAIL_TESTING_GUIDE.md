# Email Testing Guide

Complete guide for testing the welcome email sequence on The Patient's Compass.

## Prerequisites

- ✅ Resend domain verified (thepatientscompass.com)
- ✅ Development sign-in page available at `/dev/signin`
- ✅ Email sequence database table created
- ✅ Welcome email templates configured

## Testing Steps

### Step 1: Create a Test User Account

1. Visit: **https://thepatientscompass.com/dev/signin**
2. Enter:
   - **Name:** Test User
   - **Email:** your-personal-email@gmail.com (use a real email you can check)
3. Click "Sign In for Testing"
4. You'll be automatically logged in

### Step 2: Verify Admin Status

Once logged in, you should have admin access. If you don't see admin features, you may need to manually set your role to admin in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-personal-email@gmail.com';
```

### Step 3: Manually Trigger Welcome Email 1

Now that you're logged in as admin, trigger the first email:

**Option A: Via Browser Console**
```javascript
// In browser console (F12 → Console tab)
await fetch('/api/trpc/emailSequence.triggerEmail1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
}).then(r => r.json()).then(console.log);
```

**Option B: Via cURL**
```bash
curl -X POST https://thepatientscompass.com/api/trpc/emailSequence.triggerEmail1 \
  -H "Content-Type: application/json" \
  -d '{}' \
  -b "manus_session=YOUR_SESSION_COOKIE"
```

### Step 4: Check Your Email

1. Go to your email inbox (the one you used in Step 1)
2. Look for email from: **noreply@thepatientscompass.com**
3. Subject: **"Welcome to The Patient's Compass! 🏥"**

**If email arrives:**
- ✅ Resend integration working
- ✅ Email templates rendering correctly
- ✅ Domain verification complete

**If email doesn't arrive:**
- Check spam/promotions folder
- Verify Resend domain status (should be "Partially Verified" or better)
- Check Resend dashboard for bounce/failure messages
- Review server logs: `tail -f .manus-logs/devserver.log`

### Step 5: Test Email 2 and 3

Repeat Step 3 with:

**Email 2:**
```javascript
await fetch('/api/trpc/emailSequence.triggerEmail2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
}).then(r => r.json()).then(console.log);
```

**Email 3:**
```javascript
await fetch('/api/trpc/emailSequence.triggerEmail3', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
}).then(r => r.json()).then(console.log);
```

### Step 6: Verify Email Sequence Status

Check the email sequence status in the database:

```sql
SELECT * FROM email_sequences WHERE userId = 1;
```

Expected output after testing all 3 emails:
- `email1Sent = 1`, `email1SentAt = [timestamp]`
- `email2Sent = 1`, `email2SentAt = [timestamp]`
- `email3Sent = 1`, `email3SentAt = [timestamp]`

## Troubleshooting

### Email Not Arriving

1. **Check Resend Dashboard**
   - Go to https://resend.com/emails
   - Look for recent emails from your test
   - Check for bounce/failure status

2. **Verify Domain**
   - Go to https://resend.com/domains
   - Confirm thepatientscompass.com shows "Verified" or "Partially Verified"
   - If not, complete DNS setup

3. **Check API Key**
   - Verify `RESEND_API_KEY` is set in environment
   - Test with curl: `curl -H "Authorization: Bearer $RESEND_API_KEY" https://api.resend.com/emails`

4. **Check Server Logs**
   ```bash
   tail -f .manus-logs/devserver.log | grep -i email
   ```

### Email Triggers But Doesn't Send

1. Check database for errors:
   ```sql
   SELECT * FROM email_sequences WHERE userId = 1;
   ```

2. Verify email address is valid:
   ```sql
   SELECT email FROM users WHERE id = 1;
   ```

3. Check for rate limiting:
   - Resend free tier: 100 emails/day
   - If exceeded, wait until next day

### Admin Access Denied

If you get "Only admins can trigger emails" error:

1. Verify your user role:
   ```sql
   SELECT role FROM users WHERE email = 'your-email@gmail.com';
   ```

2. If role is 'user', update it:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@gmail.com';
   ```

3. Log out and log back in

## Email Content Verification

Each email should contain:

**Email 1 (Day 0):**
- Subject: "Welcome to The Patient's Compass! 🏥"
- Links to: Popular books, biomarker guides
- CTA: "Start Your Health Journey"

**Email 2 (Day 2):**
- Subject: "Understanding Your Biomarkers 📊"
- Links to: Biomarker directory, lab analysis guides
- CTA: "Explore Biomarkers"

**Email 3 (Day 5):**
- Subject: "Your AI Health Assistant is Ready 🤖"
- Links to: AI assistant, lifestyle customizer
- CTA: "Start AI Consultation"

## Production Deployment

Once testing is complete:

1. **Set up Heartbeat Cron Jobs**
   - Call `trpc.emailSequence.setupScheduledEmails.mutate()` from admin panel
   - This creates three daily cron jobs for automated email delivery

2. **Monitor Email Delivery**
   - Check Resend dashboard daily
   - Monitor bounce/complaint rates
   - Adjust send times if needed

3. **Track Engagement**
   - Set up Resend webhooks for opens/clicks
   - Monitor email sequence status in database
   - Create Plausible goals for email-driven conversions

## Support

For issues or questions:
- Check Resend documentation: https://resend.com/docs
- Review email sequence code: `server/_core/welcomeEmailSequence.ts`
- Check database schema: `drizzle/schema.ts` (email_sequences table)
