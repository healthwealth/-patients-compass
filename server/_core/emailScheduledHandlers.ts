import type { Request, Response } from "express";
import { getDb } from "../db";
import * as emailSeqDb from "../db.email-sequence";
import {
  sendWelcomeEmail1,
  sendWelcomeEmail2,
  sendWelcomeEmail3,
} from "./welcomeEmailSequence";
import { sdk } from "./sdk";

/**
 * Handler for scheduled email 1 (Day 0 - Welcome + Popular Books)
 * Triggered by Heartbeat cron job
 */
export async function handleScheduledEmail1(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "database-unavailable" });
    }

    // Get users created today who should receive email 1
    const sequences = await emailSeqDb.getUsersForEmail1();
    console.log(`[EmailScheduler] Processing ${sequences.length} users for email 1`);

    let sent = 0;
    let failed = 0;

    for (const seq of sequences) {
      try {
        // Get user info
        const userResult = await db
          .select()
          .from(require("../drizzle/schema").users)
          .where(
            require("drizzle-orm").eq(
              require("../drizzle/schema").users.id,
              seq.userId,
            ),
          )
          .limit(1);

        if (userResult.length === 0) {
          console.warn(`[EmailScheduler] User ${seq.userId} not found`);
          failed++;
          continue;
        }

        const user = userResult[0];

        // Send email
        const success = await sendWelcomeEmail1({
          userName: user.name || "there",
          userEmail: user.email || "",
          userId: seq.userId,
        });

        if (success) {
          await emailSeqDb.markEmailSent(seq.userId, 1);
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`[EmailScheduler] Error sending email 1 to user ${seq.userId}:`, error);
        failed++;
      }
    }

    res.json({
      ok: true,
      email: 1,
      sent,
      failed,
      total: sequences.length,
    });
  } catch (error) {
    console.error("[EmailScheduler] Handler error:", error);
    res.status(500).json({
      error: String(error),
      context: { handler: "email1" },
    });
  }
}

/**
 * Handler for scheduled email 2 (Day 2 - Biomarker Guides)
 * Triggered by Heartbeat cron job
 */
export async function handleScheduledEmail2(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "database-unavailable" });
    }

    // Get users created 2 days ago who should receive email 2
    const sequences = await emailSeqDb.getUsersForEmail2();
    console.log(`[EmailScheduler] Processing ${sequences.length} users for email 2`);

    let sent = 0;
    let failed = 0;

    for (const seq of sequences) {
      try {
        const userResult = await db
          .select()
          .from(require("../drizzle/schema").users)
          .where(
            require("drizzle-orm").eq(
              require("../drizzle/schema").users.id,
              seq.userId,
            ),
          )
          .limit(1);

        if (userResult.length === 0) {
          failed++;
          continue;
        }

        const user = userResult[0];

        const success = await sendWelcomeEmail2({
          userName: user.name || "there",
          userEmail: user.email || "",
          userId: seq.userId,
        });

        if (success) {
          await emailSeqDb.markEmailSent(seq.userId, 2);
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`[EmailScheduler] Error sending email 2 to user ${seq.userId}:`, error);
        failed++;
      }
    }

    res.json({
      ok: true,
      email: 2,
      sent,
      failed,
      total: sequences.length,
    });
  } catch (error) {
    console.error("[EmailScheduler] Handler error:", error);
    res.status(500).json({
      error: String(error),
      context: { handler: "email2" },
    });
  }
}

/**
 * Handler for scheduled email 3 (Day 5 - AI Assistant + Lab Analysis)
 * Triggered by Heartbeat cron job
 */
export async function handleScheduledEmail3(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "database-unavailable" });
    }

    // Get users created 5 days ago who should receive email 3
    const sequences = await emailSeqDb.getUsersForEmail3();
    console.log(`[EmailScheduler] Processing ${sequences.length} users for email 3`);

    let sent = 0;
    let failed = 0;

    for (const seq of sequences) {
      try {
        const userResult = await db
          .select()
          .from(require("../drizzle/schema").users)
          .where(
            require("drizzle-orm").eq(
              require("../drizzle/schema").users.id,
              seq.userId,
            ),
          )
          .limit(1);

        if (userResult.length === 0) {
          failed++;
          continue;
        }

        const user = userResult[0];

        const success = await sendWelcomeEmail3({
          userName: user.name || "there",
          userEmail: user.email || "",
          userId: seq.userId,
        });

        if (success) {
          await emailSeqDb.markEmailSent(seq.userId, 3);
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`[EmailScheduler] Error sending email 3 to user ${seq.userId}:`, error);
        failed++;
      }
    }

    res.json({
      ok: true,
      email: 3,
      sent,
      failed,
      total: sequences.length,
    });
  } catch (error) {
    console.error("[EmailScheduler] Handler error:", error);
    res.status(500).json({
      error: String(error),
      context: { handler: "email3" },
    });
  }
}
