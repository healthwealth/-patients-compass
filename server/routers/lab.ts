import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import {
  createLabReport,
  updateLabReport,
  getLabReportsByUser,
  getLabReportById,
  saveBiomarkerReading,
  getBiomarkerHistory,
  subscribeEmail,
  getWaitlistCount,
  getWaitlistEntries,
  getDb,
} from "../db";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { sendWaitlistConfirmation, sendBulkReEngagement } from "../_core/email";
import { emailSubscribers } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// ─── Lab Analysis Router ──────────────────────────────────────────────────────

export const labRouter = router({
  /**
   * Analyze lab report text using LLM and return structured insights.
   * This is a public procedure so unauthenticated users can try the demo.
   */
  analyzeText: publicProcedure
    .input(
      z.object({
        text: z.string().min(10).max(20000),
        fileName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const systemPrompt = `You are a Clinical Laboratory Scientist with 20+ years of experience. 
Your role is to analyze lab report text and provide:
1. Identified biomarkers with their values and units
2. Standard reference range comparison
3. Optimal functional medicine range comparison  
4. Clinical interpretation using functional medicine principles
5. Actionable recommendations

IMPORTANT: Always include a disclaimer that this is educational only and not medical advice.
Return structured JSON with the following schema:
{
  "biomarkers": [
    {
      "name": "Ferritin",
      "value": 24,
      "unit": "ng/mL",
      "standardRange": "15-150 ng/mL",
      "optimalRange": "50-100 ng/mL",
      "status": "suboptimal" | "optimal" | "high" | "critical_low" | "critical_high",
      "interpretation": "Brief clinical interpretation",
      "recommendation": "Actionable suggestion"
    }
  ],
  "overallAssessment": "Summary of the overall health picture",
  "keyFindings": ["Finding 1", "Finding 2"],
  "doctorDiscussionPoints": ["Point 1 to discuss with doctor"],
  "disclaimer": "Educational disclaimer"
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Please analyze this lab report:\n\n${input.text}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "lab_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                biomarkers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      value: { type: "number" },
                      unit: { type: "string" },
                      standardRange: { type: "string" },
                      optimalRange: { type: "string" },
                      status: {
                        type: "string",
                        enum: [
                          "suboptimal",
                          "optimal",
                          "high",
                          "critical_low",
                          "critical_high",
                        ],
                      },
                      interpretation: { type: "string" },
                      recommendation: { type: "string" },
                    },
                    required: [
                      "name",
                      "value",
                      "unit",
                      "standardRange",
                      "optimalRange",
                      "status",
                      "interpretation",
                      "recommendation",
                    ],
                    additionalProperties: false,
                  },
                },
                overallAssessment: { type: "string" },
                keyFindings: { type: "array", items: { type: "string" } },
                doctorDiscussionPoints: {
                  type: "array",
                  items: { type: "string" },
                },
                disclaimer: { type: "string" },
              },
              required: [
                "biomarkers",
                "overallAssessment",
                "keyFindings",
                "doctorDiscussionPoints",
                "disclaimer",
              ],
              additionalProperties: false,
            },
          },
        },
      } as any);

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === 'string' ? rawContent : null;
      if (!content) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze lab report",
        });
      }

      return JSON.parse(content) as {
        biomarkers: Array<{
          name: string;
          value: number;
          unit: string;
          standardRange: string;
          optimalRange: string;
          status: string;
          interpretation: string;
          recommendation: string;
        }>;
        overallAssessment: string;
        keyFindings: string[];
        doctorDiscussionPoints: string[];
        disclaimer: string;
      };
    }),

  /**
   * Save a lab report for an authenticated user.
   */
  save: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        rawText: z.string(),
        analysisResult: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const report = await createLabReport({
        userId: ctx.user.id,
        fileName: input.fileName,
        rawText: input.rawText,
      });

      if (report && input.analysisResult) {
        const updated = await updateLabReport(report.id, {
          analysisResult: input.analysisResult,
          status: "completed",
        });

        // Save individual biomarker readings for trend tracking
        const analysis = input.analysisResult as any;
        if (analysis?.biomarkers && Array.isArray(analysis.biomarkers)) {
          for (const biomarker of analysis.biomarkers) {
            if (biomarker.value && biomarker.name) {
              await saveBiomarkerReading({
                userId: ctx.user.id,
                labReportId: report.id,
                biomarkerName: biomarker.name,
                value: biomarker.value,
                unit: biomarker.unit,
              });
            }
          }
        }

        // Notify owner about new lab analysis
        const biomarkerCount = (input.analysisResult as any)?.biomarkers?.length ?? 0;
        await notifyOwner({
          title: "New Lab Report Analyzed",
          content: `User ${ctx.user.name || ctx.user.email || ctx.user.id} analyzed lab report "${input.fileName}" — ${biomarkerCount} biomarker(s) identified.`,
        }).catch(() => {}); // Non-blocking

        return updated;
      }

      return report;
    }),

  /**
   * List all lab reports for the authenticated user.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return getLabReportsByUser(ctx.user.id);
  }),

  /**
   * Get a specific lab report by ID.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const report = await getLabReportById(input.id);
      if (!report || report.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return report;
    }),

  /**
   * Get biomarker history for trend tracking.
   */
  biomarkerHistory: protectedProcedure.query(async ({ ctx }) => {
    return getBiomarkerHistory(ctx.user.id);
  }),
});

// ─── Email Subscription Router ────────────────────────────────────────────────

export const emailRouter = router({
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return subscribeEmail({
        email: input.email,
        name: input.name,
        source: "landing_page",
      });
    }),

  joinWaitlist: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await subscribeEmail({
        email: input.email,
        source: "signin_waitlist",
      });
      // Send confirmation email and notify owner for new entries
      if (!result.alreadySubscribed) {
        // Send transactional confirmation email via Resend
        await sendWaitlistConfirmation(input.email);
        // Also notify owner for tracking
        await notifyOwner({
          title: "New Sign-In Waitlist Entry",
          content: `${input.email} joined the sign-in waitlist and wants to be notified when authentication is back online.`,
        });
      }
      return result;
    }),

  waitlistCount: publicProcedure.query(async () => {
    const count = await getWaitlistCount();
    return { count };
  }),

  waitlistLatest: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { latestAt: null };
    const [row] = await db
      .select({ createdAt: emailSubscribers.createdAt })
      .from(emailSubscribers)
      .where(eq(emailSubscribers.source, "signin_waitlist"))
      .orderBy(desc(emailSubscribers.createdAt))
      .limit(1);
    return { latestAt: row?.createdAt ?? null };
  }),

  waitlistEntries: adminProcedure.query(async () => {
    // Admin-only: return full waitlist for export (enforced by adminProcedure middleware)
    return getWaitlistEntries();
  }),

  notifyAllWaitlist: adminProcedure.mutation(async () => {
    // Admin-only: send re-engagement emails to all waitlist subscribers
    // (role enforcement handled by adminProcedure middleware)
    const entries = await getWaitlistEntries();
    if (entries.length === 0) {
      return { sent: false, count: 0, message: "No waitlist entries found." };
    }

    // Send bulk re-engagement emails via Resend
    const emails = entries.map((e) => e.email);
    const result = await sendBulkReEngagement(emails);

    // Also notify owner of the bulk send
    await notifyOwner({
      title: `Re-Engagement Emails Sent — ${result.sent}/${entries.length} Delivered`,
      content: `Successfully sent re-engagement emails to ${result.sent} subscribers.${result.failed > 0 ? ` ${result.failed} failed to send.` : ""}`,
    });

    return {
      sent: result.sent > 0,
      count: result.sent,
      message: `Sent ${result.sent} re-engagement email${result.sent === 1 ? "" : "s"}${result.failed > 0 ? ` (${result.failed} failed)` : ""}.`,
    };
  }),
});
