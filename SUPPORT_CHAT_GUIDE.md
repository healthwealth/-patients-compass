# AI-Powered Support Chat Widget — Complete Guide

Your Patient's Compass now includes an intelligent support chat widget powered by Dr. Compass AI. This guide covers setup, customization, and best practices.

## 🎯 Overview

The support chat widget is an AI-powered customer support system that:
- **Detects support categories** automatically (biomarker, lab analysis, books, billing, technical, general)
- **Routes to appropriate AI mode** based on question type
- **Escalates to human support** when needed
- **Maintains conversation history** for context
- **Saves conversations** locally for continuity

## 🚀 How It Works

### 1. User Initiates Chat
- Click the floating chat button (bottom-right corner)
- Widget opens with conversation history
- User types their question

### 2. AI Categorizes Request
- LLM analyzes the message
- Determines support category and confidence level
- Detects if escalation is needed

### 3. AI Generates Response
- Uses category-specific system prompt
- References knowledge base (biomarkers, books, FAQs)
- Provides helpful, empathetic response

### 4. Escalation (if needed)
- If question requires human support
- Shows "Contact Support" button
- User can escalate with one click
- Support team notified via email

## 📋 Support Categories

| Category | Handles | Example Questions |
|----------|---------|-------------------|
| **Biomarker** | Biomarker explanations, ranges, symptoms | "What is a high cholesterol level?" |
| **Lab Analysis** | Lab reports, uploading, interpretation | "How do I upload my lab report?" |
| **Books** | Book catalog, recommendations, content | "Which book covers glucose management?" |
| **Billing** | Pricing, subscriptions, payments | "What's your pricing?" |
| **Technical** | Website issues, login problems | "I can't log in" |
| **General** | Health info, wellness advice | "How do I improve my health?" |
| **Escalation** | Urgent issues, complaints | "I need to speak with someone" |

## 🎨 Widget Features

### Floating Button
- Located bottom-right corner
- Sage green color (matches brand)
- Pulsing animation when new messages
- Click to open/close

### Chat Interface
- Message history with timestamps
- User messages (sage green bubbles)
- AI responses (gray bubbles with markdown support)
- Category label on AI responses
- Typing indicator with animated dots

### Controls
- **Send Button** — Send message (or press Enter)
- **Clear History** — Delete conversation (bottom-left)
- **Close Button** — Close widget (top-right)

### Escalation Alert
- Amber-colored alert box
- Shows when human support needed
- "Contact Support" button
- Displays support contact info

## 💾 Conversation History

### Local Storage
- Conversations saved to browser localStorage
- Key: `supportChatHistory`
- Persists across page reloads
- Survives browser restarts

### Clear History
- Click "Clear history" button in widget
- Removes all messages
- Clears localStorage
- Starts fresh conversation

## 🔧 Configuration

### Customization Options

**Change Support Email:**
```typescript
// server/routers/supportChat.ts
export const supportChatRouter = router({
  getEscalationInfo: publicProcedure.query(() => {
    return {
      email: "your-support-email@example.com", // ← Change here
      phone: "+1-555-0123",
      responseTime: "Usually within 24 hours",
      hours: "Monday-Friday, 9am-5pm PST",
    };
  }),
});
```

**Customize System Prompts:**
```typescript
// server/routers/supportChat.ts
const categoryPrompts: Record<SupportCategory, string> = {
  biomarker: `Your custom biomarker prompt here...`,
  lab_analysis: `Your custom lab analysis prompt here...`,
  // ... etc
};
```

**Change Widget Colors:**
```typescript
// client/src/components/SupportChatWidget.tsx
// Line 50: className="...bg-sage-500..." → change to your color
// Line 80: className="...bg-sage-600..." → change to your color
```

**Adjust Widget Position:**
```typescript
// client/src/components/SupportChatWidget.tsx
// Line 46: className="fixed bottom-6 right-6..." 
// Change bottom-6 and right-6 to adjust position
```

## 📊 Analytics & Monitoring

### Track Support Metrics

**Common Questions:**
- Monitor which categories receive most questions
- Identify gaps in knowledge base
- Update FAQ based on patterns

**Escalation Rate:**
- Track how many conversations escalate
- Identify topics needing human expertise
- Improve AI prompts for low-escalation categories

**Response Quality:**
- Monitor user satisfaction (future feature)
- Track conversation length
- Identify confusing responses

### Access Conversation Logs

Conversations are stored in browser localStorage. To export:

```javascript
// In browser console
const history = JSON.parse(localStorage.getItem('supportChatHistory'));
console.log(history);
// Copy and save to file
```

## 🚨 Troubleshooting

### Widget Not Appearing
1. Check if JavaScript is enabled
2. Verify `SupportChatWidget` is imported in App.tsx
3. Check browser console for errors
4. Clear browser cache and reload

### AI Responses Not Helpful
1. Check if LLM API key is configured
2. Review system prompt for the category
3. Add more context to knowledge base
4. Consider escalating to human support

### Escalation Not Working
1. Verify support email is correct
2. Check if email service is configured
3. Test with `/dev/signin` account
4. Check server logs for errors

### Conversation History Lost
1. Check if localStorage is enabled
2. Verify browser hasn't cleared site data
3. Try incognito/private mode
4. Check browser storage quota

## 🔐 Privacy & Data

### Data Stored Locally
- Conversations saved in browser localStorage
- NOT sent to external servers
- User can clear anytime
- No tracking or analytics

### Data Sent to LLM
- Only current conversation sent to LLM
- Used for generating response
- NOT stored by LLM provider
- Follows your LLM provider's privacy policy

### Escalation Data
- Escalation messages sent via email
- Stored in email system
- Follow your email provider's privacy policy

## 🎓 Best Practices

### For Users
1. **Be specific** — More detail = better responses
2. **Ask follow-ups** — Widget maintains context
3. **Use clear language** — Avoid jargon when possible
4. **Escalate when needed** — Don't hesitate to ask for human help

### For Support Team
1. **Monitor common questions** — Update FAQ based on patterns
2. **Improve prompts** — Refine system prompts based on feedback
3. **Track escalations** — Identify topics needing attention
4. **Update knowledge base** — Add new content as needed

## 📱 Mobile Experience

### Responsive Design
- Widget adapts to mobile screens
- Floating button positioned for thumb access
- Chat window resizes for mobile viewport
- Touch-friendly buttons and inputs

### Testing on Mobile
1. Open site on mobile device
2. Click floating chat button (bottom-right)
3. Type message and send
4. Verify response appears
5. Test escalation flow

## 🔄 Integration with Other Systems

### Email Integration
- Escalations sent to support email
- Configure in `getEscalationInfo()`
- Works with Resend, Gmail, etc.

### LLM Integration
- Uses existing Claude/GPT integration
- Leverages your LLM credits
- No additional setup needed

### Analytics Integration
- Can track widget usage with Plausible
- Add custom events for key interactions
- Monitor support chat traffic

## 🚀 Future Enhancements

### Planned Features
1. **User Satisfaction Rating** — Thumbs up/down on responses
2. **Suggested Follow-ups** — AI suggests next questions
3. **Knowledge Base Search** — Search your docs directly
4. **Canned Responses** — Quick templates for common questions
5. **Multi-language Support** — Support multiple languages
6. **Sentiment Analysis** — Detect frustrated users for escalation
7. **Response Time Analytics** — Track response quality
8. **A/B Testing** — Test different prompts and flows

### Feedback
- Monitor user feedback on responses
- Iterate on system prompts
- Expand knowledge base
- Improve categorization

## 📞 Support Contact

**Widget Support Email:** support@thepatientscompass.com  
**Response Time:** Usually within 24 hours  
**Hours:** Monday-Friday, 9am-5pm PST

---

## Code Reference

### Key Files
- `server/routers/supportChat.ts` — Backend router and LLM logic
- `client/src/components/SupportChatWidget.tsx` — Frontend widget
- `server/routers/supportChat.test.ts` — Unit tests (12/12 passing)

### tRPC Procedures
- `supportChat.sendMessage` — Send message and get response
- `supportChat.detectEscalation` — Check if escalation needed
- `supportChat.getEscalationInfo` — Get support contact info

### Component Props
- None required — widget is self-contained
- Automatically integrated into App.tsx
- Works on all pages

## 🎉 You're Ready!

Your support chat widget is now live and ready to handle customer inquiries. Monitor usage patterns and iterate on responses to continuously improve the experience.

**Next Steps:**
1. Test the widget with various questions
2. Monitor escalation patterns
3. Update system prompts based on feedback
4. Track common questions and update FAQ
5. Gather user feedback and iterate
