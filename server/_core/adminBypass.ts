import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

/**
 * Admin bypass endpoint for development.
 * Creates a test admin user and sets a session cookie.
 * Only available in development mode.
 */
export function registerAdminBypassRoute(app: Express) {
  // Only enable in development
  if (ENV.isProduction) {
    return;
  }

  app.post("/api/dev/admin-bypass", async (req: Request, res: Response) => {
    try {
      // Create or get test admin user
      const testAdminOpenId = "dev-admin-test";
      const testAdminEmail = "admin@test.local";

      // Upsert test admin user
      await db.upsertUser({
        openId: testAdminOpenId,
        name: "Dev Admin",
        email: testAdminEmail,
        loginMethod: "dev-bypass",
        role: "admin",
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(testAdminOpenId, {
        name: "Dev Admin",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to dashboard
      res.json({
        success: true,
        message: "Admin session created",
        user: {
          openId: testAdminOpenId,
          email: testAdminEmail,
          role: "admin",
        },
      });
    } catch (error) {
      console.error("[Admin Bypass] Error:", error);
      res.status(500).json({ error: "Failed to create admin session" });
    }
  });

  console.log("[Admin Bypass] Development endpoint registered at /api/dev/admin-bypass");
}
