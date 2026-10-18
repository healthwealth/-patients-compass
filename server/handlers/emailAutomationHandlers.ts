import { Request, Response } from "express";
import { sdk } from "../_core/sdk";
import {
  getUsersNeedingTrialExpirationEmails,
  getUsersNeedingOnboardingEmails,
  markTrialExpirationEmailSent,
  markOnboardingEmailSent,
} from "../db.emailAutomation";
import {
  sendTrialExpirationEmail,
  sendOnboardingEmail1,
  sendOnboardingEmail2,
  sendOnboardingEmail3,
} from "../_core/emailService";

/**
 * Heartbeat handler for sending trial expiration emails
 * Called daily at 9 AM UTC (1 day before trial expires)
 */
export async function handleTrialExpirationEmails(
  req: Request,
  res: Response
) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    const usersNeedingEmail = await getUsersNeedingTrialExpirationEmails();

    let sent = 0;
    let failed = 0;

    for (const user of usersNeedingEmail) {
      try {
        await sendTrialExpirationEmail(
          user.email!,
          user.name || "Valued User",
          1, // 1 day remaining
          user.userId
        );

        await markTrialExpirationEmailSent(user.userId);
        sent++;
      } catch (error) {
        console.error(
          `Failed to send trial expiration email to user ${user.userId}:`,
          error
        );
        failed++;
      }
    }

    res.json({
      ok: true,
      sent,
      failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in trial expiration email handler:", error);
    res.status(500).json({
      error: String(error),
      context: { handler: "trialExpirationEmails" },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Heartbeat handler for sending onboarding emails
 * Called daily at 9 AM UTC (sends emails on days 1, 3, 5)
 */
export async function handleOnboardingEmails(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    const usersNeedingEmail = await getUsersNeedingOnboardingEmails();

    let sent = 0;
    let failed = 0;

    for (const userEmail of usersNeedingEmail) {
      try {
        const emailNumber = userEmail.emailNumber as 1 | 2 | 3;
        const sendFunctions = {
          1: sendOnboardingEmail1,
          2: sendOnboardingEmail2,
          3: sendOnboardingEmail3,
        };

        await sendFunctions[emailNumber](
          userEmail.email,
          userEmail.name || "Valued User",
          userEmail.userId
        );

        await markOnboardingEmailSent(
          userEmail.userId,
          userEmail.emailNumber as 1 | 2 | 3
        );
        sent++;
      } catch (error) {
        console.error(
          `Failed to send onboarding email ${userEmail.emailNumber} to user ${userEmail.userId}:`,
          error
        );
        failed++;
      }
    }

    res.json({
      ok: true,
      sent,
      failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in onboarding email handler:", error);
    res.status(500).json({
      error: String(error),
      context: { handler: "onboardingEmails" },
      timestamp: new Date().toISOString(),
    });
  }
}

