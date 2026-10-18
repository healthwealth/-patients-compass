import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as emailSeqDb from "../db.email-sequence";
import { SCHEDULED_JOBS } from "../_core/scheduledJobs";
import { handleScheduledEmail1, handleScheduledEmail2, handleScheduledEmail3 } from "../_core/emailScheduledHandlers";
import { z } from "zod";

/**
 * Email Sequence Router
 * Manages welcome email sequences for new users
 */
export const emailSequenceRouter = router({
  /**
   * Initialize welcome email sequence for a new user
   * Called after user signs up
   */
  initializeWelcomeSequence: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      // Create email sequence entry
      await emailSeqDb.createEmailSequence(ctx.user.id);

      return {
        success: true,
        message: "Welcome email sequence initialized",
        userId: ctx.user.id,
      };
    } catch (error) {
      console.error("[EmailSequence] Failed to initialize:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to initialize email sequence",
      });
    }
  }),

  /**
   * Get email sequence status for current user
   */
  getSequenceStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const sequence = await emailSeqDb.getEmailSequence(ctx.user.id);

      if (!sequence) {
        return {
          initialized: false,
          status: "not_started",
        };
      }

      return {
        initialized: true,
        status: sequence.status,
        email1: {
          sent: sequence.email1Sent === 1,
          sentAt: sequence.email1SentAt,
          opened: sequence.email1Opened === 1,
        },
        email2: {
          sent: sequence.email2Sent === 1,
          sentAt: sequence.email2SentAt,
          opened: sequence.email2Opened === 1,
        },
        email3: {
          sent: sequence.email3Sent === 1,
          sentAt: sequence.email3SentAt,
          opened: sequence.email3Opened === 1,
        },
      };
    } catch (error) {
      console.error("[EmailSequence] Failed to get status:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get email sequence status",
      });
    }
  }),

  /**
   * Admin: Create scheduled cron jobs for email sequences
   * Should be called once during setup
   */
  setupScheduledEmails: protectedProcedure.mutation(async ({ ctx }) => {
    // Only admins can set up scheduled emails
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can set up scheduled emails",
      });
    }

    // On Cloudflare the schedules are built into the Worker (Cron Trigger in
    // wrangler.jsonc, dispatched by worker/cron.ts), so there is nothing to create.
    return {
      success: true,
      message: "Scheduled emails run automatically from the Cloudflare Cron Trigger",
      jobs: SCHEDULED_JOBS.filter(job => job.path.startsWith("/api/scheduled/email-")).map(job => ({
        name: job.name,
        taskUid: `cloudflare-cron:${job.name}`,
        nextExecution: null as string | null,
      })),
    };
  }),

  /**
   * Admin: Manually trigger welcome email 1 for testing
   */
  triggerEmail1: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can trigger emails",
      });
    }

    try {
      const mockReq = { headers: {} } as any;
      const mockRes = { status: () => mockRes, json: (data: any) => data } as any;
      await handleScheduledEmail1(mockReq, mockRes);
      return { success: true, message: "Email 1 triggered" };
    } catch (error) {
      console.error("[EmailSequence] Failed to trigger email 1:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to trigger email 1",
      });
    }
  }),

  /**
   * Admin: Manually trigger welcome email 2 for testing
   */
  triggerEmail2: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can trigger emails",
      });
    }

    try {
      const mockReq = { headers: {} } as any;
      const mockRes = { status: () => mockRes, json: (data: any) => data } as any;
      await handleScheduledEmail2(mockReq, mockRes);
      return { success: true, message: "Email 2 triggered" };
    } catch (error) {
      console.error("[EmailSequence] Failed to trigger email 2:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to trigger email 2",
      });
    }
  }),

  /**
   * Admin: Manually trigger welcome email 3 for testing
   */
  triggerEmail3: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can trigger emails",
      });
    }

    try {
      const mockReq = { headers: {} } as any;
      const mockRes = { status: () => mockRes, json: (data: any) => data } as any;
      await handleScheduledEmail3(mockReq, mockRes);
      return { success: true, message: "Email 3 triggered" };
    } catch (error) {
      console.error("[EmailSequence] Failed to trigger email 3:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to trigger email 3",
      });
    }
  }),
});
