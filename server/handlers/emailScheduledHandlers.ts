import { Request, Response } from "express";
import { getDb } from "../db";
import { users, emailAutomation } from "../../drizzle/schema";
import { eq, and, lt, gte, lte, isNull } from "drizzle-orm";
import { sendTrialExpirationEmail, sendOnboardingEmail1, sendOnboardingEmail2, sendOnboardingEmail3 } from "../_core/emailService";
import { sdk } from "../_core/sdk";

/**
 * Handler for trial expiration reminder emails (runs daily)
 * Sends email 1 day before trial expires to users who haven't upgraded
 */
export async function handleTrialExpirationReminder(req: Request, res: Response) {
  try {
    // Authenticate as cron
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    // Find users with trials expiring in 1 day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    const expiringTrials = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.isTrialActive, 1),
          gte(users.trialEndDate, new Date(tomorrow.setHours(0, 0, 0, 0))),
          lte(users.trialEndDate, tomorrowEnd),
          eq(users.subscriptionStatus, "free")
        )
      );

    let sentCount = 0;
    for (const u of expiringTrials) {
      try {
        // Check if we already sent this email
        const existing = await db
          .select()
          .from(emailAutomation)
          .where(
            and(
              eq(emailAutomation.userId, u.id),
              eq(emailAutomation.trialExpirationEmailSent, 1)
            )
          );

        if (existing.length === 0 && u.email) {
          // Send email
          const daysRemaining = u.trialEndDate ? Math.ceil((u.trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 1;
          await sendTrialExpirationEmail(u.email, u.name || "User", daysRemaining, u.id);

          // Log the email
          await db.insert(emailAutomation).values({
            userId: u.id,
            trialExpirationEmailSent: 1,
            trialExpirationEmailSentAt: new Date(),
          });

          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send trial expiration email to user ${u.id}:`, error);
      }
    }

    res.json({
      ok: true,
      message: `Trial expiration reminders sent to ${sentCount} users`,
      count: sentCount,
    });
  } catch (error) {
    console.error("Trial expiration handler error:", error);
    res.status(500).json({
      error: "Trial expiration handler failed",
      message: (error as Error).message,
      stack: (error as Error).stack,
      context: { url: req.url, taskUid: (await sdk.authenticateRequest(req)).taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler for onboarding email sequence (runs daily)
 * Sends onboarding emails on days 1, 3, and 5 after signup
 */
export async function handleOnboardingSequence(req: Request, res: Response) {
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

    const now = new Date();
    let sentCount = 0;

    // Day 1 onboarding (24 hours after signup)
    const day1Start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const day1End = new Date(now.getTime() - 23 * 60 * 60 * 1000);

    const day1Users = await db
      .select()
      .from(users)
      .where(
        and(
          gte(users.createdAt, day1Start),
          lte(users.createdAt, day1End)
        )
      );

    for (const u of day1Users) {
      try {
        const existing = await db
          .select()
          .from(emailAutomation)
          .where(
            and(
              eq(emailAutomation.userId, u.id),
              eq(emailAutomation.onboardingEmail1Sent, 1)
            )
          );

        if (existing.length === 0 && u.email) {
          await sendOnboardingEmail1(u.email, u.name || "User", u.id);
          await db.insert(emailAutomation).values({
            userId: u.id,
            onboardingEmail1Sent: 1,
            onboardingEmail1SentAt: new Date(),
          });
          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send day 1 onboarding email to user ${u.id}:`, error);
      }
    }

    // Day 3 onboarding (72 hours after signup)
    const day3Start = new Date(now.getTime() - 72 * 60 * 60 * 1000);
    const day3End = new Date(now.getTime() - 71 * 60 * 60 * 1000);

    const day3Users = await db
      .select()
      .from(users)
      .where(
        and(
          gte(users.createdAt, day3Start),
          lte(users.createdAt, day3End)
        )
      );

    for (const u of day3Users) {
      try {
        const existing = await db
          .select()
          .from(emailAutomation)
          .where(
            and(
              eq(emailAutomation.userId, u.id),
              eq(emailAutomation.onboardingEmail2Sent, 1)
            )
          );

        if (existing.length === 0 && u.email) {
          await sendOnboardingEmail2(u.email, u.name || "User", u.id);
          await db.insert(emailAutomation).values({
            userId: u.id,
            onboardingEmail2Sent: 1,
            onboardingEmail2SentAt: new Date(),
          });
          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send day 3 onboarding email to user ${u.id}:`, error);
      }
    }

    // Day 5 onboarding (120 hours after signup)
    const day5Start = new Date(now.getTime() - 120 * 60 * 60 * 1000);
    const day5End = new Date(now.getTime() - 119 * 60 * 60 * 1000);

    const day5Users = await db
      .select()
      .from(users)
      .where(
        and(
          gte(users.createdAt, day5Start),
          lte(users.createdAt, day5End)
        )
      );

    for (const u of day5Users) {
      try {
        const existing = await db
          .select()
          .from(emailAutomation)
          .where(
            and(
              eq(emailAutomation.userId, u.id),
              eq(emailAutomation.onboardingEmail3Sent, 1)
            )
          );

        if (existing.length === 0 && u.email) {
          await sendOnboardingEmail3(u.email, u.name || "User", u.id);
          await db.insert(emailAutomation).values({
            userId: u.id,
            onboardingEmail3Sent: 1,
            onboardingEmail3SentAt: new Date(),
          });
          sentCount++;
        }
      } catch (error) {
        console.error(`Failed to send day 5 onboarding email to user ${u.id}:`, error);
      }
    }

    res.json({
      ok: true,
      message: `Onboarding emails sent to ${sentCount} users`,
      count: sentCount,
    });
  } catch (error) {
    console.error("Onboarding sequence handler error:", error);
    res.status(500).json({
      error: "Onboarding sequence handler failed",
      message: (error as Error).message,
      stack: (error as Error).stack,
      context: { url: req.url, taskUid: (await sdk.authenticateRequest(req)).taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handler for daily analytics snapshot (runs daily at midnight UTC)
 * Captures key metrics for historical tracking
 */
export async function handleDailyAnalyticsSnapshot(req: Request, res: Response) {
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

    // Import analytics helpers
    const { createDailySnapshot } = await import("../db.analytics");

    // Capture snapshot
    await createDailySnapshot();

    res.json({
      ok: true,
      message: "Daily analytics snapshot captured",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analytics snapshot handler error:", error);
    res.status(500).json({
      error: "Analytics snapshot handler failed",
      message: (error as Error).message,
      stack: (error as Error).stack,
      context: { url: req.url, taskUid: (await sdk.authenticateRequest(req)).taskUid },
      timestamp: new Date().toISOString(),
    });
  }
}
