import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { users, emailAutomation } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyUnsubscribeToken } from "../_core/unsubscribeTokens";

export const unsubscribeRouter = Router();

/**
 * GET /api/unsubscribe/verify
 * Verify unsubscribe token and return user info (for confirmation page)
 */
unsubscribeRouter.get("/verify", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing unsubscribe token",
      });
    }

    const decoded = verifyUnsubscribeToken(token);
    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: "Unsubscribe token expired or invalid",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
      });
    }

    const user = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
      },
    });
  } catch (error) {
    console.error("[UnsubscribeHandler] Verify failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify unsubscribe token",
    });
  }
});

/**
 * POST /api/unsubscribe/confirm
 * Process unsubscribe request with optional reason
 */
unsubscribeRouter.post("/confirm", async (req: Request, res: Response) => {
  try {
    const { token, reason } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing unsubscribe token",
      });
    }

    const decoded = verifyUnsubscribeToken(token);
    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: "Unsubscribe token expired or invalid",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
      });
    }

    // Update emailAutomation record
    const now = new Date();
    await db
      .update(emailAutomation)
      .set({
        // Disable all email preferences
        emailPreferences: JSON.stringify({
          marketing: false,
          transactional: false,
          digests: false,
          frequency: "never",
        }),
        updatedAt: now,
      })
      .where(eq(emailAutomation.userId, decoded.userId));

    // Also update user email preferences if they exist
    await db
      .update(users)
      .set({
        updatedAt: now,
      })
      .where(eq(users.id, decoded.userId));

    res.json({
      success: true,
      message: "You have been unsubscribed from all emails",
    });
  } catch (error) {
    console.error("[UnsubscribeHandler] Confirm failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process unsubscribe request",
    });
  }
});

/**
 * POST /api/unsubscribe/resubscribe
 * Allow users to resubscribe to emails
 */
unsubscribeRouter.post("/resubscribe", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing unsubscribe token",
      });
    }

    const decoded = verifyUnsubscribeToken(token);
    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: "Unsubscribe token expired or invalid",
      });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database connection failed",
      });
    }

    // Update emailAutomation record
    const now = new Date();
    await db
      .update(emailAutomation)
      .set({
        // Re-enable default email preferences
        emailPreferences: JSON.stringify({
          marketing: true,
          transactional: true,
          digests: true,
          frequency: "weekly",
        }),
        updatedAt: now,
      })
      .where(eq(emailAutomation.userId, decoded.userId));

    res.json({
      success: true,
      message: "You have been resubscribed to emails",
    });
  } catch (error) {
    console.error("[UnsubscribeHandler] Resubscribe failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process resubscribe request",
    });
  }
});
