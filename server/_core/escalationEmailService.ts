/**
 * Email Automation Service for Support Escalations
 * Sends automated emails when users escalate support tickets
 */

import { sendEmail } from "./email";
import { ENV } from "./env";

export interface EscalationEmailData {
  userId: number;
  userEmail: string;
  userName: string;
  category: string;
  message: string;
  conversationHistory: Array<{ role: string; content: string }>;
  timestamp: Date;
  urgency: "low" | "medium" | "high";
}

/**
 * Generate HTML email template for escalation
 */
function generateEscalationEmailTemplate(data: EscalationEmailData): string {
  const conversationHtml = data.conversationHistory
    .map((msg) => {
      const isUser = msg.role === "user";
      const bgColor = isUser ? "#f0f0f0" : "#e8f4f8";
      const sender = isUser ? "User" : "Health Companion AI";
      return `
        <div style="margin: 10px 0; padding: 10px; background-color: ${bgColor}; border-radius: 5px;">
          <strong>${sender}:</strong>
          <p style="margin: 5px 0;">${msg.content}</p>
        </div>
      `;
    })
    .join("");

  const urgencyColor =
    data.urgency === "high"
      ? "#ff4444"
      : data.urgency === "medium"
        ? "#ff9900"
        : "#0066cc";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2d5f3f; color: white; padding: 20px; border-radius: 5px; }
        .content { margin: 20px 0; }
        .conversation { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        .urgency-badge { 
          display: inline-block; 
          padding: 5px 10px; 
          background-color: ${urgencyColor}; 
          color: white; 
          border-radius: 3px; 
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Support Escalation Alert</h2>
          <p>A user has escalated their support request and needs immediate attention.</p>
        </div>

        <div class="content">
          <h3>Escalation Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>User Name:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="mailto:${data.userEmail}">${data.userEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Category:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Urgency:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><span class="urgency-badge">${data.urgency.toUpperCase()}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Time:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${data.timestamp.toLocaleString()}</td>
            </tr>
          </table>

          <h3>User Message</h3>
          <p style="background-color: #fff3cd; padding: 10px; border-left: 4px solid #ffc107; border-radius: 3px;">
            ${data.message}
          </p>

          <h3>Conversation History</h3>
          <div class="conversation">
            ${conversationHtml}
          </div>

          <h3>Next Steps</h3>
          <ol>
            <li>Review the conversation history above</li>
            <li>Respond to the user at ${data.userEmail}</li>
            <li>Provide personalized support based on their specific needs</li>
            <li>Update the ticket status in your support system</li>
          </ol>
        </div>

        <div class="footer">
          <p>This is an automated message from The Patient's Compass Support System.</p>
          <p>User ID: ${data.userId} | Escalation Time: ${data.timestamp.toISOString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate auto-response email for user
 */
function generateUserAutoResponseTemplate(data: EscalationEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2d5f3f; color: white; padding: 20px; border-radius: 5px; text-align: center; }
        .content { margin: 20px 0; line-height: 1.6; }
        .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
        .highlight { background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>We have Received Your Request</h2>
        </div>

        <div class="content">
          <p>Hi ${data.userName},</p>

          <p>Thank you for reaching out to us. We have received your support request and understand that you need assistance with <strong>${data.category}</strong>.</p>

          <div class="highlight">
            <p><strong>Your Request Summary:</strong></p>
            <p>${data.message}</p>
          </div>

          <p>Our support team will review your message and the conversation history with Health Companion AI, and will get back to you within 24 hours with a personalized response.</p>

          <p><strong>What to expect:</strong></p>
          <ul>
            <li>Our team will carefully review your specific situation</li>
            <li>We will provide detailed guidance based on your needs</li>
            <li>If needed, we may recommend consulting with a healthcare professional</li>
            <li>You will receive a response at this email address</li>
          </ul>

          <p>In the meantime, you can continue using Health Companion AI for general health information and biomarker guidance.</p>

          <p>Best regards,<br>
          <strong>The Patient's Compass Support Team</strong></p>
        </div>

        <div class="footer">
          <p>This is an automated confirmation email. Your support request has been logged and assigned to our team.</p>
          <p>Ticket Reference: USER-${data.userId}-${Date.now()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send escalation email to support team
 */
export async function sendEscalationEmail(
  data: EscalationEmailData
): Promise<boolean> {
  try {
    const supportEmail = "support@thepatientscompass.com";

    // Send email to support team
    try {
      await sendEmail({
        to: supportEmail,
        subject: `[${data.urgency.toUpperCase()}] Support Escalation - ${data.category} - ${data.userName}`,
        html: generateEscalationEmailTemplate(data),
      });
    } catch (error) {
      console.error("[Escalation Email] Failed to send to support team:", error);
      return false;
    }

    // Send auto-response to user
    try {
      await sendEmail({
        to: data.userEmail,
        subject: "We have Received Your Support Request",
        html: generateUserAutoResponseTemplate(data),
      });
    } catch (error) {
      console.error(
        "[Escalation Email] Failed to send auto-response to user:",
        error
      );
      // Do not fail if user email fails, as support team already got the message
    }

    console.log(
      `[Escalation Email] Successfully sent escalation for user ${data.userId}`
    );
    return true;
  } catch (error) {
    console.error("[Escalation Email] Error sending escalation email:", error);
    return false;
  }
}

/**
 * Generate escalation summary for logging
 */
export function generateEscalationSummary(data: EscalationEmailData): string {
  return `
Escalation Summary:
- User: ${data.userName} (${data.userEmail})
- Category: ${data.category}
- Urgency: ${data.urgency}
- Timestamp: ${data.timestamp.toISOString()}
- Message: ${data.message.substring(0, 100)}...
- Conversation Length: ${data.conversationHistory.length} messages
  `;
}
