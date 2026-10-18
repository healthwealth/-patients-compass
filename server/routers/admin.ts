import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "../_core/email";
import crypto from "crypto";

// Store verification codes in memory (in production, use database)
const verificationCodes = new Map<string, { code: string; name: string; expiresAt: number }>();

function generateVerificationCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export const adminRouter = router({
  sendVerificationEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(2),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const code = generateVerificationCode();
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

        // Store verification code
        verificationCodes.set(input.email, {
          code,
          name: input.name,
          expiresAt,
        });

        // Send verification email
        await sendEmail({
          to: input.email,
          subject: "Verify Your Admin Account - The Patient's Compass",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7E9A85;">Welcome to Admin Control, ${input.name}!</h2>
              <p>Thank you for signing up to manage The Patient's Compass. To complete your admin account setup, please verify your email address using the code below:</p>
              
              <div style="background-color: #F9F6F0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 2px; color: #7E9A85; margin: 0;">
                  ${code}
                </p>
              </div>
              
              <p>This code will expire in 15 minutes.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this verification, please ignore this email.</p>
              
              <hr style="border: none; border-top: 1px solid #EBE6DC; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                The Patient's Compass - Health Intelligence System<br>
                Built by a Clinical Laboratory Scientist with 20+ years of experience
              </p>
            </div>
          `,
        });

        return {
          success: true,
          message: "Verification email sent successfully",
        };
      } catch (error) {
        console.error("Failed to send verification email:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send verification email. Please try again.",
        });
      }
    }),

  verifyAdminEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const stored = verificationCodes.get(input.email);

        if (!stored) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No verification code found for this email. Please request a new one.",
          });
        }

        if (Date.now() > stored.expiresAt) {
          verificationCodes.delete(input.email);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Verification code has expired. Please request a new one.",
          });
        }

        if (input.code !== stored.code) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid verification code. Please try again.",
          });
        }

        // Clear the verification code
        verificationCodes.delete(input.email);

        // Send confirmation email
        await sendEmail({
          to: input.email,
          subject: "Admin Account Verified - The Patient's Compass",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7E9A85;">✓ Admin Account Verified!</h2>
              <p>Your admin account has been successfully verified. You can now access the Admin Control Panel to manage your health education platform.</p>
              
              <div style="background-color: #F9F6F0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Email:</strong> ${input.email}</p>
                <p><strong>Name:</strong> ${stored.name}</p>
              </div>
              
              <p>You can now log in to the <a href="https://thepatientscompass.com/admin/control" style="color: #7E9A85; text-decoration: none;">Admin Control Panel</a> to:</p>
              <ul style="color: #5C5A59;">
                <li>View user activity and analytics</li>
                <li>Manage subscriber lists</li>
                <li>Monitor platform health</li>
                <li>Access admin settings</li>
              </ul>
              
              <hr style="border: none; border-top: 1px solid #EBE6DC; margin: 20px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                The Patient's Compass - Health Intelligence System
              </p>
            </div>
          `,
        });

        return {
          success: true,
          message: "Email verified successfully",
          email: input.email,
          name: stored.name,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Verification error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred during verification",
        });
      }
    }),
});
