import { Request, Response } from "express";
import { getDb } from "../db";
import { emailSequences } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Handle email unsubscribe requests
 * Generates unsubscribe tokens and handles unsubscribe confirmations
 */

export function generateUnsubscribeToken(userId: number, email: string): string {
  // Create a simple token from userId and email
  // In production, use JWT or a proper token library
  const data = `${userId}:${email}:${Date.now()}`;
  return Buffer.from(data).toString("base64");
}

export function parseUnsubscribeToken(token: string): { userId: number; email: string } | null {
  try {
    const data = Buffer.from(token, "base64").toString("utf-8");
    const [userIdStr, email] = data.split(":");
    const userId = parseInt(userIdStr);
    if (isNaN(userId)) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

/**
 * GET /api/unsubscribe?token=...
 * Unsubscribe user from email sequence
 */
export async function handleUnsubscribe(req: Request, res: Response) {
  try {
    const { token, reason } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Invalid unsubscribe token" });
    }

    const parsed = parseUnsubscribeToken(token);
    if (!parsed) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    // Update email sequence to mark as unsubscribed
    await db
      .update(emailSequences)
      .set({
        unsubscribed: 1,
        unsubscribeReason: reason && typeof reason === "string" ? reason : "User requested",
        unsubscribeAt: new Date(),
      })
      .where(eq(emailSequences.userId, parsed.userId));

    // Return HTML confirmation page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 600px; margin: 50px auto; background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            h1 { color: #333; margin: 0 0 10px 0; }
            p { color: #666; line-height: 1.6; }
            .success { color: #10b981; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Unsubscribed</h1>
            <p class="success">You've been successfully unsubscribed from our email list.</p>
            <p>We've noted your preference and won't send you marketing emails.</p>
            <p>You'll still receive important transactional emails about your account.</p>
            <p style="margin-top: 30px; font-size: 14px; color: #999;">
              <a href="https://thepatientscompass.com" style="color: #10b981; text-decoration: none;">Return to The Patient's Compass</a>
            </p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("[Unsubscribe] Error:", error);
    return res.status(500).json({ error: "Failed to process unsubscribe request" });
  }
}

/**
 * Generate unsubscribe link for email
 */
export function getUnsubscribeLink(userId: number, email: string): string {
  const token = generateUnsubscribeToken(userId, email);
  return `https://thepatientscompass.com/api/unsubscribe?token=${encodeURIComponent(token)}`;
}
