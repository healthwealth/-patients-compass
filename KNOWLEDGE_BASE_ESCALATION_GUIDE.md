# Knowledge Base & Escalation System Guide

## Overview

The Patient's Compass now features an enhanced support chat system with:
- **Comprehensive Biomarker Knowledge Base** — 25+ biomarkers with optimal ranges, symptoms, and recommendations
- **Intelligent Escalation System** — Automatic email routing for complex support issues
- **Category-Aware Responses** — AI adapts responses based on support category

---

## Biomarker Knowledge Base

### Available Biomarkers

The knowledge base includes detailed information for:

**Cardiovascular Health:**
- HDL Cholesterol
- LDL Cholesterol
- Triglycerides
- Total Cholesterol
- Homocysteine
- C-Reactive Protein (CRP)
- Blood Pressure

**Metabolic Health:**
- Fasting Glucose
- Hemoglobin A1C
- Insulin
- Metabolic Syndrome
- BMI

**Thyroid Function:**
- TSH (Thyroid Stimulating Hormone)
- Free T3
- Free T4
- TPO Antibodies

**Immune & Inflammation:**
- White Blood Cell Count
- Vitamin D
- Magnesium
- Zinc

**Liver & Kidney Function:**
- ALT (Alanine Aminotransferase)
- AST (Aspartate Aminotransferase)
- Creatinine
- BUN (Blood Urea Nitrogen)

**Bone Health:**
- Calcium
- Phosphorus
- Alkaline Phosphatase

### Accessing Biomarker Information

**In Support Chat:**
Users can ask questions like:
- "What does my HDL cholesterol of 45 mean?"
- "How can I improve my vitamin D levels?"
- "Is my TSH level normal?"

**Via API:**
```typescript
const info = await trpc.supportChat.getBiomarkerInfo.query({
  biomarkerName: "HDL Cholesterol"
});
```

### Biomarker Data Structure

Each biomarker includes:
- **Optimal Range** — Target values for health
- **Low Symptoms** — What happens when too low
- **High Symptoms** — What happens when too high
- **Lifestyle Factors** — Diet, exercise, sleep impacts
- **Supplements** — Evidence-based recommendations
- **When to Worry** — Red flags requiring medical attention
- **Related Biomarkers** — Connected health metrics

---

## Escalation System

### How Escalation Works

1. **Detection** — AI detects if issue requires human support
2. **Categorization** — Classifies issue by type (urgent, complex, etc.)
3. **Email Routing** — Sends formatted email to support team
4. **Tracking** — Logs escalation for follow-up

### Escalation Categories

**Automatic Escalation Triggers:**
- Urgent medical concerns
- Billing/payment issues
- Technical bugs
- Feature requests
- Complaints or negative feedback
- Requests for human support

**Support Categories:**
- `biomarker` — Biomarker questions
- `lab_analysis` — Lab report analysis
- `books` — Book recommendations
- `billing` — Subscription/payment
- `technical` — Website/app issues
- `general` — General health questions
- `escalation` — Requires human support

### Escalation Email Template

When escalated, support team receives:

```
Subject: [URGENT] Support Escalation - {Category}

From: {User Name} <{User Email}>
Category: {Category}
Urgency: {Low/Medium/High}
Timestamp: {ISO DateTime}

User Message:
{User's Message}

Conversation History:
{Full chat history}

---
Action Required: Please respond to {User Email} within 24 hours
```

### Triggering Escalation

**From Chat Widget:**
```typescript
await trpc.supportChat.escalateToSupport.mutate({
  userEmail: "user@example.com",
  userName: "John Doe",
  category: "billing",
  message: "I was charged twice for my subscription",
  urgency: "high"
});
```

**Response:**
```json
{
  "success": true,
  "message": "Your request has been sent to our support team. You will receive an email confirmation shortly."
}
```

---

## Support Chat Categories & Responses

### 1. Biomarker Support
**When:** User asks about specific biomarkers
**Response Style:** Educational, reference knowledge base
**Example:**
- Q: "What does HDL cholesterol mean?"
- A: "HDL is 'good' cholesterol that helps remove other forms of cholesterol from your arteries. Optimal levels are above 60 mg/dL. Our Biomarker Library has detailed information on how to improve it through diet and exercise."

### 2. Lab Analysis Support
**When:** User asks about lab reports or AI analysis
**Response Style:** Guidance-focused, direct to AI Lab Scanner
**Example:**
- Q: "How do I upload my lab results?"
- A: "You can upload lab reports in the Dashboard under 'Lab Reports'. Our AI Lab Scanner will analyze your results and provide personalized insights. Click here to get started."

### 3. Books Support
**When:** User asks about books or recommendations
**Response Style:** Helpful, reference catalog
**Example:**
- Q: "Do you have books about heart health?"
- A: "Yes! We recommend 'The Cardiovascular Blueprint' which covers heart health comprehensively. We also have 'Cholesterol Clarity' for specific lipid management. Both are available in our Books section."

### 4. Billing Support
**When:** User has payment or subscription questions
**Response Style:** Professional, clear, offer escalation
**Example:**
- Q: "How much does the premium plan cost?"
- A: "Premium is $9.99/month or $99/year (save 17%). Both include unlimited lab analysis, personalized recommendations, and priority support. Contact our team for enterprise pricing."

### 5. Technical Support
**When:** User reports bugs or feature issues
**Response Style:** Troubleshooting-focused, escalate if needed
**Example:**
- Q: "The chat widget won't load on mobile"
- A: "Try clearing your browser cache and refreshing. If it still doesn't work, please let me escalate this to our technical team for investigation."

### 6. General Health Support
**When:** General wellness questions
**Response Style:** Educational, always recommend doctor
**Example:**
- Q: "Should I take vitamin D supplements?"
- A: "Many people benefit from vitamin D supplementation, especially in winter. However, I recommend getting your vitamin D levels tested first and consulting your doctor about the right dosage for you."

---

## Analytics & Monitoring

### Tracking Escalations

Monitor escalation metrics:
- Escalation rate by category
- Average response time
- User satisfaction
- Common escalation reasons

### Improving Responses

1. **Review Common Questions** — Identify gaps in knowledge base
2. **Update Biomarker Data** — Keep information current
3. **Refine Prompts** — Improve response quality
4. **A/B Test Responses** — Compare effectiveness

---

## Configuration

### Environment Variables

```bash
# Email Configuration
RESEND_API_KEY=re_xxxxx
RESEND_SENDER_EMAIL=support@thepatientscompass.com

# Support Email
SUPPORT_EMAIL=support@thepatientscompass.com

# LLM Configuration
BUILT_IN_FORGE_API_KEY=xxxxx
BUILT_IN_FORGE_API_URL=https://api.manus.im
```

### Customizing Biomarker Data

Edit `/server/_core/biomarkerKnowledgeBase.ts` to:
- Add new biomarkers
- Update optimal ranges
- Modify recommendations
- Add new categories

---

## Troubleshooting

### Escalation Email Not Sending

1. Check `RESEND_API_KEY` is valid
2. Verify `RESEND_SENDER_EMAIL` is verified in Resend
3. Check server logs: `tail -f .manus-logs/devserver.log`
4. Test manually: `curl -X POST /api/escalation/test`

### Knowledge Base Not Loading

1. Verify `biomarkerKnowledgeBase.ts` has no syntax errors
2. Check TypeScript compilation: `pnpm check`
3. Restart dev server: `webdev_restart_server`
4. Clear browser cache

### AI Responses Not Using Knowledge Base

1. Verify knowledge base is imported in `supportChat.ts`
2. Check system prompt includes biomarker context
3. Test with specific biomarker query
4. Review LLM response in logs

---

## Best Practices

✅ **Do:**
- Keep biomarker data current with latest research
- Monitor escalation patterns for improvement areas
- Test new prompts before deploying
- Document common questions
- Respond to escalations within 24 hours

❌ **Don't:**
- Provide medical diagnosis (always recommend doctor)
- Make promises about health outcomes
- Store sensitive health data in chat logs
- Ignore escalation emails
- Update biomarker ranges without verification

---

## Support Resources

- **Knowledge Base:** `/server/_core/biomarkerKnowledgeBase.ts`
- **Escalation Service:** `/server/_core/escalationEmailService.ts`
- **Support Router:** `/server/routers/supportChat.ts`
- **Chat Widget:** `/client/src/components/SupportChatWidget.tsx`

For questions or improvements, contact: support@thepatientscompass.com
