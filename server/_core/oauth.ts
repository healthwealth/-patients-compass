import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import * as emailSeqDb from "../db.email-sequence";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function parseReturnPath(state: string): string {
  try {
    const decoded = atob(state);
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.returnPath === "string") {
      // Ensure returnPath is a relative path to prevent open redirects
      const path = parsed.returnPath;
      if (path.startsWith("/")) return path;
    }
  } catch {
    // ignore
  }
  return "/";
}

function parseRememberMe(state: string): boolean {
  try {
    const decoded = atob(state);
    const parsed = JSON.parse(decoded);
    return parsed?.rememberMe === true;
  } catch {
    return false;
  }
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.redirect(302, "/auth/error?reason=callback");
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Initialize email sequence for new users
      const userRecord = await db.getUserByOpenId(userInfo.openId);
      if (userRecord) {
        try {
          await emailSeqDb.createEmailSequence(userRecord.id);
        } catch (error) {
          console.warn("[OAuth] Failed to create email sequence:", error);
          // Don't fail the OAuth flow if email sequence creation fails
        }
      }

      const rememberMe = parseRememberMe(state);
      const sessionDuration = rememberMe ? ONE_YEAR_MS : 8 * 60 * 60 * 1000;
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: sessionDuration,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: sessionDuration });

      const returnPath = parseReturnPath(state);
      res.redirect(302, returnPath);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.redirect(302, "/auth/error?reason=provider");
    }
  });
}
