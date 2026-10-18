import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { recordUserActivity } from "../db";
import { users, emailVerificationCodes, emailSequences } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { storagePut } from "../storage";

/**
 * User profile management router
 * Handles profile retrieval, updates, subscription management, email verification, and newsletter preferences
 */
export const profileRouter = router({
  /**
   * Get current user's profile information
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (userList.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User profile not found",
      });
    }

    const user = userList[0];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastSignedIn: user.lastSignedIn,
      loginMethod: user.loginMethod,
      subscriptionStatus: user.subscriptionStatus,
      stripeSubscriptionId: user.stripeSubscriptionId,
      subscriptionPlan: user.subscriptionPlan,
      profileImageUrl: user.profileImageUrl,
      isTrialActive: user.isTrialActive === 1,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      trialStatus: user.trialStatus,
    };
  }),

  /**
   * Update user profile information (name and email)
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        email: z.string().email("Invalid email address").optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if email is already taken (if changing email)
      if (input.email && input.email !== ctx.user.email) {
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existingUser.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already in use",
          });
        }
      }

      // Update user profile
      const updateData: Record<string, unknown> = {};
      if (input.name) updateData.name = input.name;
      if (input.email) updateData.email = input.email;

      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields to update",
        });
      }

      await db.update(users).set(updateData).where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: "Profile updated successfully",
        user: {
          name: input.name || ctx.user.name,
          email: input.email || ctx.user.email,
        },
      };
    }),

  /** Upload a user-selected avatar to managed storage. */
  uploadProfileImage: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(120),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        dataBase64: z.string().min(4).max(5_600_000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!/^[A-Za-z0-9+/=]+$/.test(input.dataBase64)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image data must be valid base64." });
      }

      const data = Buffer.from(input.dataBase64, "base64");
      if (data.length === 0 || data.length > 4 * 1024 * 1024) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Profile images must be 4 MB or smaller." });
      }

      const extension = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType.split("/")[1];
      const uploaded = await storagePut(`profile-images/${ctx.user.id}/avatar.${extension}`, data, input.mimeType);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(users).set({ profileImageUrl: uploaded.url }).where(eq(users.id, ctx.user.id));
      await recordUserActivity({
        userId: ctx.user.id,
        eventType: "profile_image_updated",
        title: "Profile picture updated",
        summary: "Your dashboard profile picture was updated.",
      });

      return { success: true, profileImageUrl: uploaded.url };
    }),

  /** Remove the saved profile avatar reference and restore the initials fallback. */
  removeProfileImage: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    await db.update(users).set({ profileImageUrl: null }).where(eq(users.id, ctx.user.id));
    await recordUserActivity({
      userId: ctx.user.id,
      eventType: "profile_image_removed",
      title: "Profile picture removed",
      summary: "Your dashboard now uses your initials.",
    });
    return { success: true };
  }),

  /**
   * Change user password
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
        confirmPassword: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify passwords match
      if (input.newPassword !== input.confirmPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Passwords do not match",
        });
      }

      // Get current user
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (userList.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const user = userList[0];

      // Check if user has password (email-based account)
      if (!user.passwordHash) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This account uses OAuth and does not have a password",
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(input.newPassword, salt);

      // Update password
      await db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: "Password changed successfully",
      };
    }),

  /**
   * Get subscription details
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (userList.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const user = userList[0];

    return {
      status: user.subscriptionStatus,
      stripeSubscriptionId: user.stripeSubscriptionId,
      isTrialActive: user.isTrialActive === 1,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      trialStatus: user.trialStatus,
      aiQueryCount: user.aiQueryCount,
      aiQueryDate: user.aiQueryDate,
    };
  }),

  /**
   * Delete user account (soft delete - mark as inactive)
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string().min(1, "Password is required"),
        confirmDelete: z.boolean().refine((val) => val === true, {
          message: "You must confirm account deletion",
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get current user
      const userList = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (userList.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const user = userList[0];

      // Only allow deletion for email-based accounts
      if (user.loginMethod !== "email") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete OAuth accounts through this method",
        });
      }

      // Verify password
      if (user.passwordHash) {
        const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
        if (!isValidPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Password is incorrect",
          });
        }
      }

      // Mark user as deleted by clearing sensitive data
      await db
        .update(users)
        .set({
          email: `deleted_${user.id}_${Date.now()}@deleted.local`,
          name: "Deleted User",
          passwordHash: null,
          verificationToken: null,
          resetToken: null,
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        message: "Account deleted successfully",
      };
    }),

  /**
   * Send verification code to new email address
   */
  sendEmailVerification: protectedProcedure
    .input(
      z.object({
        newEmail: z.string().email("Invalid email address"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      if (input.newEmail.toLowerCase() === (ctx.user.email ?? "").toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "New email must be different from your current email",
        });
      }

      // Check if email is already taken
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.newEmail))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already in use",
        });
      }

      // Generate 6-digit verification code
      const verificationCode = Math.random().toString().slice(2, 8).padStart(6, "0");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Delete any existing verification codes for this user
      await db
        .delete(emailVerificationCodes)
        .where(eq(emailVerificationCodes.userId, ctx.user.id));

      // Create new verification code
      await db.insert(emailVerificationCodes).values({
        userId: ctx.user.id,
        newEmail: input.newEmail,
        verificationCode,
        expiresAt,
      });

      // TODO: Send email with verification code via Resend
      // await sendVerificationEmail(input.newEmail, verificationCode);

      return {
        success: true,
        message: "Verification code sent to your new email",
      };
    }),

  /**
   * Verify email change with code
   */
  verifyEmailChange: protectedProcedure
    .input(
      z.object({
        verificationCode: z.string().length(6, "Verification code must be 6 digits"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find verification code
      const codeRecord = await db
        .select()
        .from(emailVerificationCodes)
        .where(
          and(
            eq(emailVerificationCodes.userId, ctx.user.id),
            eq(emailVerificationCodes.verificationCode, input.verificationCode)
          )
        )
        .limit(1);

      if (codeRecord.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid verification code",
        });
      }

      const code = codeRecord[0];

      // Check if code has expired
      if (new Date() > code.expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verification code has expired",
        });
      }

      // Check if code has been verified
      if (code.verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verification code has already been used",
        });
      }

      // Update email and mark as verified
      await db
        .update(users)
        .set({ email: code.newEmail })
        .where(eq(users.id, ctx.user.id));

      await db
        .update(emailVerificationCodes)
        .set({ verified: 1 })
        .where(eq(emailVerificationCodes.id, code.id));

      return {
        success: true,
        message: "Email updated successfully",
        newEmail: code.newEmail,
      };
    }),

  /**
   * Get newsletter subscription preferences
   */
  getNewsletterPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const emailSeq = await db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.userId, ctx.user.id))
      .limit(1);

    if (emailSeq.length === 0) {
      return {
        marketing: true,
        transactional: true,
        digests: true,
        unsubscribed: false,
      };
    }

    const prefs = emailSeq[0].emailPreferences as Record<string, boolean>;
    return {
      marketing: prefs.marketing ?? true,
      transactional: prefs.transactional ?? true,
      digests: prefs.digests ?? true,
      unsubscribed: emailSeq[0].unsubscribed === 1,
    };
  }),

  /**
   * Update newsletter subscription preferences
   */
  updateNewsletterPreferences: protectedProcedure
    .input(
      z.object({
        marketing: z.boolean().optional(),
        transactional: z.boolean().optional(),
        digests: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get or create email sequence record
      let emailSeq = await db
        .select()
        .from(emailSequences)
        .where(eq(emailSequences.userId, ctx.user.id))
        .limit(1);

      const currentPrefs = emailSeq.length > 0 ? (emailSeq[0].emailPreferences as Record<string, boolean>) : { marketing: true, transactional: true, digests: true };

      const updatedPrefs = {
        marketing: input.marketing ?? currentPrefs.marketing,
        transactional: input.transactional ?? currentPrefs.transactional,
        digests: input.digests ?? currentPrefs.digests,
      };

      if (emailSeq.length === 0) {
        await db.insert(emailSequences).values({
          userId: ctx.user.id,
          sequenceType: "welcome",
          emailPreferences: updatedPrefs,
        });
      } else {
        await db
          .update(emailSequences)
          .set({ emailPreferences: updatedPrefs })
          .where(eq(emailSequences.userId, ctx.user.id));
      }

      return {
        success: true,
        message: "Newsletter preferences updated",
        preferences: updatedPrefs,
      };
    }),

  /**
   * Get billing history from Stripe
   */
  getBillingHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get user with Stripe customer ID
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (userList.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const user = userList[0];

    // If user has no Stripe customer ID, return empty billing history
    if (!user.stripeCustomerId) {
      return {
        invoices: [],
        nextBillingDate: null,
        totalSpent: 0,
      };
    }

    // TODO: Fetch invoices from Stripe API
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const invoices = await stripe.invoices.list({
    //   customer: user.stripeCustomerId,
    //   limit: 12,
    // });

    return {
      invoices: [],
      nextBillingDate: user.trialEndDate,
      totalSpent: 0,
    };
  }),
});
