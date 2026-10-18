import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { runInBackground } from "../_core/runtime";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { sendEmailLoginLink, sendNewDeviceLoginEmail, sendPasswordChangedEmail, sendPasswordResetEmail, sendVerificationEmail } from "../_core/email";

const hashResetToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const emailLoginRateLimits = new Map<string, { sentAt: number; attempts: number }>();
const EMAIL_LINK_COOLDOWN_MS = 60_000;
const EMAIL_LINK_WINDOW_MS = 15 * 60_000;
const EMAIL_LINK_MAX_ATTEMPTS = 5;

/**
 * Email/password authentication router
 * Handles signup, login, password reset, and email verification
 */
export const emailAuthRouter = router({
  extendSession: protectedProcedure.mutation(async ({ ctx }) => {
    const sessionDuration = 8 * 60 * 60 * 1000;
    const sessionToken = await sdk.createSessionToken(ctx.user.openId, {
      name: ctx.user.name || "",
      expiresInMs: sessionDuration,
    });
    ctx.res.cookie(COOKIE_NAME, sessionToken, {
      ...getSessionCookieOptions(ctx.req),
      maxAge: sessionDuration,
    });
    return { success: true, sessionDuration } as const;
  }),

  /**
   * Sign up with email and password
   * Creates a new user account and sends verification email
   */
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().min(2, "Name must be at least 2 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered. Please sign in instead.",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(input.password, salt);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Create unique openId for this email-based user
      const openId = `email_${crypto.randomBytes(16).toString("hex")}`;

      // Create user
      await db.insert(users).values({
        openId,
        email: input.email,
        name: input.name,
        passwordHash,
        emailVerified: 0,
        verificationToken,
        loginMethod: "email",
      });

      if (process.env.NODE_ENV !== "test") runInBackground(sendVerificationEmail(input.email, input.name, verificationToken));

      return {
        success: true,
        message: "Account created! Please verify your email to continue.",
        email: input.email,
      };
    }),

  /**
   * Sign in with email and password
   * Returns session cookie if credentials are valid
   */
  signin: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string(),
        rememberMe: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find user by email
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (userList.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const user = userList[0];

      // Check if user has password (email-based account)
      if (!user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This account uses OAuth. Please sign in with your OAuth provider.",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please verify your email before signing in.",
        });
      }

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      const sessionDuration = input.rememberMe ? ONE_YEAR_MS : 8 * 60 * 60 * 1000;
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: sessionDuration,
      });
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(ctx.req),
        maxAge: sessionDuration,
      });

      // Create session (handled by context)
      return {
        success: true,
        message: "Signed in successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    }),

  requestEmailLoginLink: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      const now = Date.now();
      const ip = ctx.req.ip || ctx.req.headers["x-forwarded-for"]?.toString().split(",")[0] || "unknown";
      const rateKey = `${input.email.trim().toLowerCase()}:${ip}`;
      const previous = emailLoginRateLimits.get(rateKey);
      const withinWindow = previous && now - previous.sentAt < EMAIL_LINK_WINDOW_MS;
      const attempts = withinWindow ? previous.attempts : 0;
      if (withinWindow && now - previous.sentAt < EMAIL_LINK_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((EMAIL_LINK_COOLDOWN_MS - (now - previous.sentAt)) / 1000);
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Please wait ${waitSeconds} seconds before requesting another sign-in link.` });
      }
      if (attempts >= EMAIL_LINK_MAX_ATTEMPTS) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many sign-in link requests. Please try again later." });
      }
      emailLoginRateLimits.set(rateKey, { sentAt: now, attempts: attempts + 1 });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const userList = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (userList.length > 0 && userList[0].email) {
        const token = crypto.randomBytes(32).toString("hex");
        await db.update(users).set({
          emailLoginToken: hashResetToken(token),
          emailLoginTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
        }).where(eq(users.id, userList[0].id));
        if (process.env.NODE_ENV !== "test") runInBackground(sendEmailLoginLink(userList[0].email, userList[0].name || "there", token));
      }
      return { success: true, message: "If an account exists with this email, a secure sign-in link has been sent." };
    }),

  loginWithEmailLink: publicProcedure
    .input(z.object({ token: z.string().min(20) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const userList = await db.select().from(users).where(eq(users.emailLoginToken, hashResetToken(input.token))).limit(1);
      const user = userList[0];
      if (!user || !user.emailLoginTokenExpiry || user.emailLoginTokenExpiry < new Date()) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "This sign-in link is invalid or expired. Request a new link." });
      }
      const deviceSource = String(ctx.req.headers["user-agent"] || "unknown");
      const deviceHash = crypto.createHash("sha256").update(deviceSource).digest("hex");
      const isNewDevice = user.lastPasswordlessDeviceHash !== deviceHash;
      await db.update(users).set({ emailLoginToken: null, emailLoginTokenExpiry: null, lastSignedIn: new Date(), lastPasswordlessDeviceHash: deviceHash, lastPasswordlessLoginAt: new Date() }).where(eq(users.id, user.id));
      if (isNewDevice && user.email && process.env.NODE_ENV !== "test") runInBackground(sendNewDeviceLoginEmail(user.email, user.name || "there"));
      const sessionDuration = 8 * 60 * 60 * 1000;
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "", expiresInMs: sessionDuration });
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: sessionDuration });
      return { success: true, message: "Signed in successfully" };
    }),

  /**
   * Request password reset
   * Sends reset token to user's email
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find user
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (userList.length === 0) {
        // Don't reveal if email exists (security best practice)
        return {
          success: true,
          message: "If an account exists with this email, a reset link has been sent.",
        };
      }

      const user = userList[0];

      // Generate reset token (valid for 1 hour)
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      // Save reset token
      await db
        .update(users)
        .set({ resetToken: hashResetToken(resetToken), resetTokenExpiry })
        .where(eq(users.id, user.id));

      if (process.env.NODE_ENV !== "test") runInBackground(sendPasswordResetEmail(input.email, user.name || "there", resetToken));
      return {
        success: true,
        message: "If an account exists with this email, a reset link has been sent.",
      };
    }),

  /**
   * Reset password with token
   */
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find user with valid reset token
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.resetToken, hashResetToken(input.token)))
        .limit(1);

      if (userList.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired reset token",
        });
      }

      const user = userList[0];

      // Check if token is expired
      if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Reset token has expired. Please request a new one.",
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(input.newPassword, salt);

      // Update password and clear reset token
      await db
        .update(users)
        .set({
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      if (user.email && process.env.NODE_ENV !== "test") runInBackground(sendPasswordChangedEmail(user.email, user.name || "there"));

      return {
        success: true,
        message: "Password reset successfully. Please sign in with your new password.",
      };
    }),

  /**
   * Verify email with token
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find user with verification token
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, input.token))
        .limit(1);

      if (userList.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid verification token",
        });
      }

      const user = userList[0];

      // Mark email as verified
      await db
        .update(users)
        .set({
          emailVerified: 1,
          verificationToken: null,
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: "Email verified successfully! You can now sign in.",
      };
    }),

  /**
   * Resend verification email
   */
  resendVerificationEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find user
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (userList.length === 0) {
        return {
          success: true,
          message: "If an account exists, a verification email has been sent.",
        };
      }

      const user = userList[0];

      // Check if already verified
      if (user.emailVerified) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email is already verified. Please sign in.",
        });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Update verification token
      await db
        .update(users)
        .set({ verificationToken })
        .where(eq(users.id, user.id));

      if (user.email && process.env.NODE_ENV !== "test") runInBackground(sendVerificationEmail(user.email, user.name || "there", verificationToken));
      return {
        success: true,
        message: "Verification email sent. Please check your inbox.",
      };
    }),
});
