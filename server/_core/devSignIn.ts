import { Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { getDb } from "../db";
import { upsertUser } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import type { User } from "@shared/types";

/**
 * Development sign-in endpoint for testing when OAuth is unavailable.
 * Creates a test user and sets a session cookie.
 * 
 * ⚠️ WARNING: This is a development-only feature and should be removed in production.
 * Only available in development mode (NODE_ENV !== 'production').
 */
export async function devSignIn(req: Request, res: Response) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Development sign-in not available in production" });
    return;
  }

  try {
    const { email, name } = req.body;

    if (!email || !name) {
      res.status(400).json({ error: "Email and name are required" });
      return;
    }

    // Create a deterministic openId based on email for testing
    const testOpenId = `dev-test-${email.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`;

    // Upsert test user
    await upsertUser({
      openId: testOpenId,
      email,
      name,
      loginMethod: "dev-bypass",
      role: "user",
      lastSignedIn: new Date(),
    });

    // Get the user from database
    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database connection failed" });
      return;
    }

    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.openId, testOpenId))
      .limit(1);

    if (!userRecord || userRecord.length === 0) {
      res.status(500).json({ error: "Failed to create test user" });
      return;
    }

    const user = userRecord[0] as User;

    // Create session token
    const token = await sdk.createSessionToken(user.openId, {
      name: user.name || undefined,
    });

    // Set session cookie
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, cookieOptions);

    // Return success with user info
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        openId: user.openId,
        role: user.role,
      },
      message: `Welcome ${name}! You're now signed in for testing.`,
    });
  } catch (error) {
    console.error("[Dev Sign-In] Error:", error);
    res.status(500).json({ error: "Failed to create test user" });
  }
}

/**
 * Development endpoint to create a test user without setting a session.
 * Useful for testing email delivery to specific users.
 */
export async function devCreateTestUser(req: Request, res: Response) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Development endpoint not available in production" });
    return;
  }

  try {
    const { email, name } = req.body;

    if (!email || !name) {
      res.status(400).json({ error: "Email and name are required" });
      return;
    }

    // Create a deterministic openId based on email for testing
    const testOpenId = `dev-test-${email.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`;

    // Upsert test user
    await upsertUser({
      openId: testOpenId,
      email,
      name,
      loginMethod: "dev-bypass",
      role: "user",
      lastSignedIn: new Date(),
    });

    // Get the user from database
    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database connection failed" });
      return;
    }

    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.openId, testOpenId))
      .limit(1);

    if (!userRecord || userRecord.length === 0) {
      res.status(500).json({ error: "Failed to create test user" });
      return;
    }

    const user = userRecord[0] as User;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        openId: user.openId,
        role: user.role,
      },
      message: `Test user created successfully. Email sequence will be triggered on next scheduled job.`,
    });
  } catch (error) {
    console.error("[Dev Create Test User] Error:", error);
    res.status(500).json({ error: "Failed to create test user" });
  }
}
