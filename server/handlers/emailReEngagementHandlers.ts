import { getDb } from "../db";
import { users, emailAutomation } from "../../drizzle/schema";
import { eq, and, lt, gte, isNull, lte } from "drizzle-orm";
import { sendReEngagementEmail, sendWeeklyDigestEmail } from "../_core/emailService";
import { sdk } from "../_core/sdk";
import type { Request, Response } from "express";

/**
 * Handler for re-engagement campaign (runs weekly on Mondays)
 * Sends email to users who haven't logged in for 7+ days
 */
export async function handleReEngagementCampaign(req: Request, res: Response) {
  try {
    // Authenticate as cron
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Find users who haven't signed in for 7+ days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const inactiveUsers = await db
      .select()
      .from(users)
      .where(
        and(
          lt(users.lastSignedIn, sevenDaysAgo),
          eq(users.emailVerified, 1),
          eq(users.subscriptionStatus, "active")
        )
      );

    let sentCount = 0;
    for (const u of inactiveUsers) {
      try {
        // Check if we already sent re-engagement email this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const existing = await db
          .select()
          .from(emailAutomation)
          .where(
            and(
              eq(emailAutomation.userId, u.id),
              gte(emailAutomation.reEngagementEmailSentAt, weekAgo)
            )
          );

        if (existing.length === 0 && u.email) {
          // Send re-engagement email
          const daysSinceLogin = Math.floor(
            (new Date().getTime() - u.lastSignedIn.getTime()) / (1000 * 60 * 60 * 24)
          );
          await sendReEngagementEmail(u.email, u.name || "User", daysSinceLogin, u.id);

          // Log the email (create new record)
          await db.insert(emailAutomation).values({
            userId: u.id,
            reEngagementEmailSent: 1 as any,
            reEngagementEmailSentAt: new Date(),
          } as any);

          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send re-engagement email to user ${u.id}:`, error);
      }
    }

    res.json({
      ok: true,
      message: `Re-engagement emails sent to ${sentCount} users`,
      count: sentCount,
    });
  } catch (error) {
    console.error("Re-engagement campaign handler error:", error);
    const authUser = await sdk.authenticateRequest(req);
    res.status(500).json({
      error: "Re-engagement campaign handler failed",
      message: (error as Error).message,
      stack: (error as Error).stack,
      context: { url: req.url, taskUid: authUser.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler for weekly digest emails (runs every Sunday at 9am UTC)
 * Sends personalized health insights and recommendations
 */
export async function handleWeeklyDigest(req: Request, res: Response) {
  try {
    // Authenticate as cron
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Find all active users who want digest emails
    const activeUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.emailVerified, 1),
          eq(users.subscriptionStatus, "active")
        )
      );

    let sentCount = 0;
    for (const u of activeUsers) {
      try {
        // Check email preferences
        const automation = await db
          .select()
          .from(emailAutomation)
          .where(eq(emailAutomation.userId, u.id));

        const prefs = automation[0]?.emailPreferences as any || { digests: true };
        
        if (!prefs.digests || !u.email) continue;

        // Check if we already sent digest this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const recentDigest = await db
          .select()
          .from(emailAutomation)
          .where(
            and(
              eq(emailAutomation.userId, u.id),
              gte(emailAutomation.weeklyDigestEmailSentAt, weekAgo)
            )
          );

        if (recentDigest.length === 0) {
          // Send weekly digest
          await sendWeeklyDigestEmail(u.email, u.name || "User", u.id);

          // Log the email (create new record)
          await db.insert(emailAutomation).values({
            userId: u.id,
            weeklyDigestEmailSent: 1 as any,
            weeklyDigestEmailSentAt: new Date(),
          } as any);

          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send weekly digest to user ${u.id}:`, error);
      }
    }

    res.json({
      ok: true,
      message: `Weekly digest emails sent to ${sentCount} users`,
      count: sentCount,
    });
  } catch (error) {
    console.error("Weekly digest handler error:", error);
    const authUser = await sdk.authenticateRequest(req);
    res.status(500).json({
      error: "Weekly digest handler failed",
      message: (error as Error).message,
      stack: (error as Error).stack,
      context: { url: req.url, taskUid: authUser.taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
