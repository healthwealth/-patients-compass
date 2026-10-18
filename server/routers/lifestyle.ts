import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { createHealthNote, getHealthNotesByUser, deleteHealthNote, saveWellnessPlan, getWellnessPlansByUser, getWellnessPlanById, deleteWellnessPlan } from "../db";
import { TRPCError } from "@trpc/server";

const biomarkerStatusSchema = z.object({
  name: z.string(),
  status: z.enum(["critical_low", "suboptimal", "optimal", "high", "critical_high"]),
  value: z.number().optional(),
  unit: z.string().optional(),
});

// ─── Lifestyle Customizer Router ──────────────────────────────────────────────

export const lifestyleRouter = router({
  /**
   * Get AI-powered personalized nutrition & lifestyle recommendations
   * based on the user's biomarker statuses. Public so unauthenticated users can try it.
   */
  getRecommendations: publicProcedure
    .input(
      z.object({
        biomarkers: z.array(biomarkerStatusSchema).min(1).max(20),
        additionalContext: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const biomarkerSummary = input.biomarkers
        .map(
          (b) =>
            `- ${b.name}: ${b.status}${b.value ? ` (${b.value} ${b.unit ?? ""})` : ""}`
        )
        .join("\n");

      const systemPrompt = `You are a functional medicine wellness educator with expertise in nutritional biochemistry and lifestyle optimization. 
You provide educational wellness guidance based on biomarker patterns.

IMPORTANT RULES:
- This is EDUCATIONAL ONLY — not medical advice, diagnosis, or treatment
- Use supportive, empowering language
- Focus on evidence-based nutritional and lifestyle frameworks
- Always recommend consulting a healthcare provider for medical decisions
- Avoid prescriptive medical language

Return structured JSON with personalized wellness guidance.`;

      const userPrompt = `Based on these biomarker statuses, provide personalized wellness guidance:

${biomarkerSummary}

${input.additionalContext ? `Additional context: ${input.additionalContext}` : ""}

Provide educational wellness recommendations in the following categories:
1. Nutrition Focus (specific foods and nutrients to prioritize)
2. Lifestyle Focus (sleep, stress, movement recommendations)
3. Biomarker-Supportive Habits (daily habits that support these specific markers)
4. What to Discuss with Your Doctor (questions and conversation starters)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "lifestyle_recommendations",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: {
                  type: "string",
                  description: "Brief 2-3 sentence overview of the wellness picture",
                },
                nutritionFocus: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          foods: { type: "array", items: { type: "string" } },
                        },
                        required: ["title", "description", "foods"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["headline", "items"],
                  additionalProperties: false,
                },
                lifestyleFocus: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          category: {
                            type: "string",
                            enum: ["sleep", "stress", "movement", "hydration", "other"],
                          },
                          title: { type: "string" },
                          description: { type: "string" },
                          actionSteps: {
                            type: "array",
                            items: { type: "string" },
                          },
                        },
                        required: ["category", "title", "description", "actionSteps"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["headline", "items"],
                  additionalProperties: false,
                },
                biomarkerHabits: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      biomarkerName: { type: "string" },
                      habit: { type: "string" },
                      rationale: { type: "string" },
                    },
                    required: ["biomarkerName", "habit", "rationale"],
                    additionalProperties: false,
                  },
                },
                doctorQuestions: {
                  type: "array",
                  items: { type: "string" },
                },
                disclaimer: { type: "string" },
              },
              required: [
                "summary",
                "nutritionFocus",
                "lifestyleFocus",
                "biomarkerHabits",
                "doctorQuestions",
                "disclaimer",
              ],
              additionalProperties: false,
            },
          },
        },
      } as any);

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate lifestyle recommendations",
        });
      }

      return JSON.parse(content) as {
        summary: string;
        nutritionFocus: {
          headline: string;
          items: Array<{
            title: string;
            description: string;
            foods: string[];
          }>;
        };
        lifestyleFocus: {
          headline: string;
          items: Array<{
            category: string;
            title: string;
            description: string;
            actionSteps: string[];
          }>;
        };
        biomarkerHabits: Array<{
          biomarkerName: string;
          habit: string;
          rationale: string;
        }>;
        doctorQuestions: string[];
        disclaimer: string;
      };
    }),
});

// ─── Wellness Plan Router ──────────────────────────────────────────────────────────

export const wellnessPlanRouter = router({
  save: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        inputs: z.unknown(),
        planOutput: z.unknown(),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return saveWellnessPlan({
        userId: ctx.user.id,
        title: input.title,
        inputs: input.inputs,
        planOutput: input.planOutput,
        notes: input.notes,
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return getWellnessPlansByUser(ctx.user.id);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const plan = await getWellnessPlanById(input.id, ctx.user.id);
      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Wellness plan not found" });
      }
      return plan;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteWellnessPlan(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Health Notes Router ──────────────────────────────────────────────────────

export const healthNotesRouter = router({
  /**
   * Add a health timeline note (symptom, supplement, lifestyle change, etc.)
   */
  create: protectedProcedure
    .input(
      z.object({
        noteDate: z.date().optional(),
        category: z.enum([
          "symptom",
          "supplement",
          "lifestyle",
          "medication",
          "stress",
          "sleep",
          "other",
        ]),
        title: z.string().min(1).max(255),
        content: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return createHealthNote({
        userId: ctx.user.id,
        noteDate: input.noteDate,
        category: input.category,
        title: input.title,
        content: input.content,
      });
    }),

  /**
   * List all health notes for the authenticated user.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return getHealthNotesByUser(ctx.user.id);
  }),

  /**
   * Delete a health note.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteHealthNote(input.id, ctx.user.id);
      return { success: true };
    }),
});
