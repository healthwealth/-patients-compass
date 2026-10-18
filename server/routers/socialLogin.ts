import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { validateOAuthToken, createOAuthError } from "../_core/oauthValidation";
import { ENV } from "../_core/env";
import { isUniqueViolation, uniqueViolationDetail } from "../_core/dbErrors";
import { sdk } from "../_core/sdk";
import { createEmailSequence } from "../db.email-sequence";
import { getSessionCookieOptions } from "../_core/cookies";
import type { TrpcContext } from "../_core/context";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Issues the site session cookie after a verified Google/Apple sign-in. */
async function startSocialSession(ctx: TrpcContext, userId: number) {
  const db = await getDb();
  if (!db || !userId) return;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return;
  const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || "", expiresInMs: ONE_YEAR_MS });
  ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
}

/**
 * Social login router for Google and Apple OAuth integration
 * Handles user creation/update from social provider data with server-side token verification
 */
export const socialLoginRouter = router({
  /**
   * Google OAuth callback handler with server-side token verification
   * Validates the OAuth token with Google's servers before creating/updating user
   * This prevents spoofing attacks where someone could fake a Google ID
   */
  googleCallback: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Google OAuth token is required"),
        picture: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Verify OAuth token with Google's servers
        // This is the critical security step that prevents spoofing
        const tokenValidation = await validateOAuthToken(
          "google",
          input.token,
          ENV.googleClientId
        );

        if (!tokenValidation.valid) {
          throw createOAuthError(tokenValidation.error || "Token validation failed");
        }

        const googleId = tokenValidation.userId!;
        const email = tokenValidation.email!.toLowerCase();
        const name = tokenValidation.name!;
        const profileImageUrl = tokenValidation.picture;

        // Check if user exists by googleId (most secure)
        const existingByGoogleId = await db
          .select()
          .from(users)
          .where(eq(users.googleId, googleId))
          .limit(1);

        if (existingByGoogleId.length > 0) {
          // User exists with this Google ID, update last sign-in
          const user = existingByGoogleId[0];
          await db
            .update(users)
            .set({
              name: name || user.name,
              profileImageUrl: profileImageUrl || user.profileImageUrl,
              loginMethod: "google",
              lastSignedIn: new Date(),
            })
            .where(eq(users.id, user.id));

          await startSocialSession(ctx, user.id);
          return {
            success: true,
            userId: user.id,
            isNewUser: false,
            message: "Logged in successfully",
          };
        }

        // Check if email already exists (potential provider conflict)
        const existingByEmail = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingByEmail.length > 0) {
          // Email exists with different provider
          const user = existingByEmail[0];

          // Update with Google ID if not already set
          if (!user.googleId) {
            await db
              .update(users)
              .set({
                googleId,
                name: name || user.name,
                profileImageUrl: profileImageUrl || user.profileImageUrl,
                loginMethod: "google",
                lastSignedIn: new Date(),
              })
              .where(eq(users.id, user.id));
          }

          await startSocialSession(ctx, user.id);
          return {
            success: true,
            userId: user.id,
            isNewUser: false,
            message: "Logged in successfully",
          };
        }

        // Create new user from Google profile
        await db.insert(users).values({
          openId: `google_${googleId}`,
          googleId,
          email,
          name,
          profileImageUrl,
          loginMethod: "google",
          emailVerified: 1,
          lastSignedIn: new Date(),
          role: "user",
        });

        // Retrieve the newly created user
        const newUser = await db
          .select()
          .from(users)
          .where(eq(users.googleId, googleId))
          .limit(1);

        const userId = newUser[0]?.id || 0;

        await createEmailSequence(userId).catch(error => console.warn("[SocialLogin] Failed to create email sequence:", error));
        await startSocialSession(ctx, userId);
        return {
          success: true,
          userId,
          isNewUser: true,
          message: "Account created successfully",
        };
      } catch (error: any) {
        // Handle unique constraint violations
        if (isUniqueViolation(error)) {
          const detail = uniqueViolationDetail(error);
          if (detail.includes("googleId")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This Google account is already linked to another user",
            });
          }
          if (detail.includes("email")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This email is already registered",
            });
          }
        }

        // Re-throw OAuth validation errors
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("[Social Login] Google callback error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process Google login",
        });
      }
    }),

  /**
   * Apple OAuth callback handler with server-side token verification
   * Validates the OAuth token with Apple's servers before creating/updating user
   * This prevents spoofing attacks where someone could fake an Apple ID
   */
  appleCallback: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Apple OAuth token is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Verify OAuth token with Apple's servers
        // This is the critical security step that prevents spoofing
        const tokenValidation = await validateOAuthToken(
          "apple",
          input.token,
          ENV.appleServiceId,
          ENV.appleTeamId,
          ENV.appleKeyId
        );

        if (!tokenValidation.valid) {
          throw createOAuthError(tokenValidation.error || "Token validation failed");
        }

        const appleId = tokenValidation.userId!;
        const email = tokenValidation.email!.toLowerCase();
        const displayName = tokenValidation.name || "Apple User";

        // Check if user exists by appleId (most secure)
        const existingByAppleId = await db
          .select()
          .from(users)
          .where(eq(users.appleId, appleId))
          .limit(1);

        if (existingByAppleId.length > 0) {
          // User exists with this Apple ID, update last sign-in
          const user = existingByAppleId[0];
          await db
            .update(users)
            .set({
              name: displayName || user.name,
              loginMethod: "apple",
              lastSignedIn: new Date(),
            })
            .where(eq(users.id, user.id));

          await startSocialSession(ctx, user.id);
          return {
            success: true,
            userId: user.id,
            isNewUser: false,
            message: "Logged in successfully",
          };
        }

        // Check if email already exists (potential provider conflict)
        const existingByEmail = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingByEmail.length > 0) {
          // Email exists with different provider
          const user = existingByEmail[0];

          // Update with Apple ID if not already set
          if (!user.appleId) {
            await db
              .update(users)
              .set({
                appleId,
                loginMethod: "apple",
                lastSignedIn: new Date(),
              })
              .where(eq(users.id, user.id));
          }

          await startSocialSession(ctx, user.id);
          return {
            success: true,
            userId: user.id,
            isNewUser: false,
            message: "Logged in successfully",
          };
        }

        // Create new user from Apple profile
        await db.insert(users).values({
          openId: `apple_${appleId}`,
          appleId,
          email,
          name: displayName,
          loginMethod: "apple",
          emailVerified: 1,
          lastSignedIn: new Date(),
          role: "user",
        });

        // Retrieve the newly created user
        const newUser = await db
          .select()
          .from(users)
          .where(eq(users.appleId, appleId))
          .limit(1);

        const userId = newUser[0]?.id || 0;

        await createEmailSequence(userId).catch(error => console.warn("[SocialLogin] Failed to create email sequence:", error));
        await startSocialSession(ctx, userId);
        return {
          success: true,
          userId,
          isNewUser: true,
          message: "Account created successfully",
        };
      } catch (error: any) {
        // Handle unique constraint violations
        if (isUniqueViolation(error)) {
          const detail = uniqueViolationDetail(error);
          if (detail.includes("appleId")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This Apple account is already linked to another user",
            });
          }
          if (detail.includes("email")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This email is already registered",
            });
          }
        }

        // Re-throw OAuth validation errors
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("[Social Login] Apple callback error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process Apple login",
        });
      }
    }),

  /**
   * Check if email is available for signup
   * Returns availability status and normalized email
   */
  checkEmailAvailability: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const normalizedEmail = input.email.toLowerCase();

      try {
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        return {
          available: existing.length === 0,
          email: normalizedEmail,
        };
      } catch (error) {
        console.error("[Social Login] Email availability check error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check email availability",
        });
      }
    }),
});
