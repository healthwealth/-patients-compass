import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

/**
 * Session handling for the Cloudflare deployment.
 *
 * Replaces the Manus SDK. Sessions are the same signed HS256 JWT cookie the
 * site already issued (so the auth routers are unchanged); the Manus OAuth
 * exchange and Manus user sync are gone. Sign-in happens through the site's own
 * email/password, email-link, Google and Apple flows.
 *
 * Scheduled jobs are authenticated with the `x-cron-secret` header, which the
 * Worker's cron trigger adds when it calls `/api/scheduled/*` internally.
 */

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

export const CRON_SECRET_HEADER = "x-cron-secret";

/** Result of `sdk.authenticateRequest`. Cron callbacks set `isCron=true` and `taskUid`. */
export type AuthenticatedUser = User & {
  taskUid?: string;
  isCron?: boolean;
};

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function buildCronUser(taskUid: string): AuthenticatedUser {
  const now = new Date();
  return {
    id: -1,
    openId: `cron_${taskUid}`,
    name: "Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid,
    isCron: true,
  } as AuthenticatedUser;
}

class SessionService {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }

  private getSessionSecret() {
    if (!ENV.cookieSecret) {
      console.error("[Auth] JWT_SECRET is not configured — sessions cannot be issued or verified.");
    }
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  /** Create a session token for a user's openId. */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      { openId, appId: ENV.appId, name: options.name || "" },
      options
    );
  }

  async signSession(payload: SessionPayload, options: { expiresInMs?: number } = {}): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    return new SignJWT({ openId: payload.openId, appId: payload.appId, name: payload.name })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(this.getSessionSecret());
  }

  async verifySession(cookieValue: string | undefined | null): Promise<SessionPayload | null> {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), { algorithms: ["HS256"] });
      const { openId, appId, name } = payload as Record<string, unknown>;
      // `name` may legitimately be empty for some accounts.
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return { openId, appId, name: typeof name === "string" ? name : "" };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  private cronUserFromRequest(req: Request): AuthenticatedUser | null {
    const header = req.headers[CRON_SECRET_HEADER];
    const provided = Array.isArray(header) ? header[0] : header;
    const expected = ENV.cronSecret;
    if (!provided || !expected) return null;
    if (!timingSafeEqual(provided, expected)) return null;
    const taskHeader = req.headers["x-cron-task"];
    const task = (Array.isArray(taskHeader) ? taskHeader[0] : taskHeader) || "cloudflare-cron";
    return buildCronUser(task);
  }

  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const cronUser = this.cronUserFromRequest(req);
    if (cronUser) return cronUser;

    const cookies = this.parseCookies(req.headers.cookie);
    const session = await this.verifySession(cookies.get(COOKIE_NAME));
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await db.getUserByOpenId(session.openId);
    if (!user) {
      throw ForbiddenError("User not found");
    }

    const signedInAt = new Date();
    const shouldBeAdmin =
      (!!user.email && ENV.adminEmails.includes(user.email.trim().toLowerCase())) ||
      (!!ENV.ownerOpenId && user.openId === ENV.ownerOpenId);

    // Touch lastSignedIn at most every 10 minutes to keep D1 writes low.
    const stale = !user.lastSignedIn || signedInAt.getTime() - new Date(user.lastSignedIn).getTime() > 10 * 60 * 1000;
    if (stale || (shouldBeAdmin && user.role !== "admin")) {
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: signedInAt,
        ...(shouldBeAdmin && user.role !== "admin" ? { role: "admin" as const } : {}),
      });
      return { ...user, lastSignedIn: signedInAt, role: shouldBeAdmin ? "admin" : user.role };
    }

    return user;
  }
}

export const sdk = new SessionService();
