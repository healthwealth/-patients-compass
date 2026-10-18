import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { getBiomarkerInfo, getAllCategories } from "../_core/biomarkerKnowledgeBase";
import { sendEscalationEmail } from "../_core/escalationEmailService";

/**
 * Support Chat Router
 * Handles customer support inquiries with intelligent routing and escalation
 */

export type SupportCategory = "biomarker" | "lab_analysis" | "books" | "billing" | "technical" | "general" | "escalation";

interface SupportDetectionResult {
  category: SupportCategory;
  confidence: number;
  requiresEscalation: boolean;
  escalationReason?: string;
}

/**
 * Detect support category from user message
 */
async function detectSupportCategory(message: string): Promise<SupportDetectionResult> {
  const systemPrompt = `You are a support categorization AI for The Patient's Compass, a health intelligence platform.
Analyze the user's message and determine which support category it belongs to.

Categories:
- biomarker: Questions about specific biomarkers, their meanings, optimal ranges, symptoms
- lab_analysis: Questions about lab report analysis, how to interpret results, uploading labs
- books: Questions about books in our catalog, recommendations, content
- billing: Questions about subscriptions, pricing, payment issues
- technical: Website bugs, login issues, feature not working
- general: General health questions, wellness advice
- escalation: Urgent issues, complaints, requests for human support

Respond with JSON:
{
  "category": "category_name",
  "confidence": 0.95,
  "requiresEscalation": false,
  "escalationReason": null
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Categorize this message: "${message}"` },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== "string") throw new Error("No response from LLM");

    const parsed = JSON.parse(content);
    return {
      category: parsed.category || "general",
      confidence: parsed.confidence || 0.5,
      requiresEscalation: parsed.requiresEscalation || false,
      escalationReason: parsed.escalationReason,
    };
  } catch (error) {
    console.error("[SupportChat] Category detection failed:", error);
    return {
      category: "general",
      confidence: 0.3,
      requiresEscalation: false,
    };
  }
}

/**
 * Generate support-specific system prompt based on category
 */
function getSupportSystemPrompt(category: SupportCategory): string {
  const categories = getAllCategories();
  const biomarkerContext = `\n\nBiomarker Knowledge Base Available: ${categories.join(", ")}. Use this knowledge to provide accurate information about biomarkers, their optimal ranges, symptoms, and recommendations.`;
  
  const basePrompt = `You are Health Companion, the AI health assistant for The Patient's Compass.
You are knowledgeable, empathetic, and professional. You help users understand their health data and navigate the platform.${biomarkerContext}

Important guidelines:
- Be clear and educational, not prescriptive
- Always recommend consulting a doctor for medical advice
- Reference our biomarker library and books when relevant
- Keep responses concise (2-3 sentences max in chat)
- If unsure, offer to escalate to human support`;

  const categoryPrompts: Record<SupportCategory, string> = {
    biomarker: `${basePrompt}
You specialize in explaining biomarkers. Help users understand what specific biomarkers mean, their optimal ranges, symptoms of imbalance, and lifestyle factors that affect them.
Reference our Biomarker Library when relevant.`,

    lab_analysis: `${basePrompt}
You specialize in lab report analysis. Help users understand how to upload reports, what the AI looks for, how to interpret results, and what next steps they might take.
Guide them to the AI Lab Scanner feature.`,

    books: `${basePrompt}
You specialize in our book catalog. Help users find relevant books based on their interests, explain what topics each book covers, and recommend reading order.
Reference specific books from our catalog when relevant.`,

    billing: `${basePrompt}
You handle billing questions professionally. Explain our pricing tiers, subscription benefits, how to upgrade/downgrade, and refund policies.
For complex billing issues, offer to escalate to human support.`,

    technical: `${basePrompt}
You help troubleshoot technical issues. Guide users through common solutions for login problems, feature issues, and navigation.
If the issue persists, offer to escalate to human support.`,

    general: `${basePrompt}
You provide general health information and wellness guidance based on our knowledge base.
Always recommend consulting a healthcare provider for personalized medical advice.`,

    escalation: `${basePrompt}
The user is requesting human support or has an urgent issue. Acknowledge their concern, thank them for reaching out, and let them know a human team member will be in touch shortly.`,
  };

  return categoryPrompts[category] || basePrompt;
}

/**
 * Generate support response with category awareness
 */
async function generateSupportResponse(
  userMessage: string,
  category: SupportCategory,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string> {
  const systemPrompt = getSupportSystemPrompt(category);

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        { role: "user", content: userMessage },
      ],
    });

    const content = response.choices[0]?.message.content;
    if (typeof content === "string") return content;
    return "I'm having trouble responding right now. Please try again or contact support.";
  } catch (error) {
    console.error("[SupportChat] Response generation failed:", error);
    return "I apologize for the technical difficulty. Please try again or contact our support team.";
  }
}

export const supportChatRouter = router({
  /**
   * Send support message and get AI response
   */
  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional()
          .default([]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Detect support category
        const detection = await detectSupportCategory(input.message);

        // Generate response based on category
        const response = await generateSupportResponse(
          input.message,
          detection.category,
          input.conversationHistory
        );

        return {
          success: true,
          response,
          category: detection.category,
          confidence: detection.confidence,
          requiresEscalation: detection.requiresEscalation,
          escalationReason: detection.escalationReason,
        };
      } catch (error) {
        console.error("[SupportChat] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process support message",
        });
      }
    }),

  /**
   * Detect if message requires human escalation
   */
  detectEscalation: publicProcedure
    .input(z.object({ message: z.string().min(1).max(2000) }))
    .query(async ({ input }) => {
      try {
        const detection = await detectSupportCategory(input.message);
        return {
          requiresEscalation: detection.requiresEscalation,
          reason: detection.escalationReason,
          category: detection.category,
        };
      } catch (error) {
        console.error("[SupportChat] Escalation detection failed:", error);
        return {
          requiresEscalation: false,
          reason: null,
          category: "general" as SupportCategory,
        };
      }
    }),

  /**
   * Get support contact information for escalation
   */
  getEscalationInfo: publicProcedure.query(() => {
    return {
      email: "support@thepatientscompass.com",
      phone: null,
      responseTime: "Usually within 24 hours",
      hours: "Monday-Friday, 9am-5pm PST",
      message: "Our support team is here to help. We will get back to you as soon as possible.",
    };
  }),

  /**
   * Send escalation email to support team
   */
  escalateToSupport: publicProcedure
    .input(
      z.object({
        userEmail: z.string().email(),
        userName: z.string().min(1),
        category: z.string(),
        message: z.string().min(1),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional()
          .default([]),
        urgency: z.enum(["low", "medium", "high"]).optional().default("medium"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const success = await sendEscalationEmail({
          userId: Math.floor(Math.random() * 1000000),
          userEmail: input.userEmail,
          userName: input.userName,
          category: input.category,
          message: input.message,
          conversationHistory: input.conversationHistory,
          timestamp: new Date(),
          urgency: input.urgency,
        });

        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send escalation email",
          });
        }

        return {
          success: true,
          message: "Your request has been sent to our support team. You will receive an email confirmation shortly.",
        };
      } catch (error) {
        console.error("[SupportChat] Escalation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to escalate support request",
        });
      }
    }),

  /**
   * Get biomarker information from knowledge base
   */
  getBiomarkerInfo: publicProcedure
    .input(z.object({ biomarkerName: z.string().min(1) }))
    .query(({ input }) => {
      const info = getBiomarkerInfo(input.biomarkerName);
      if (!info) {
        return {
          found: false,
          message: `Biomarker "${input.biomarkerName}" not found in our knowledge base.`,
        };
      }

      return {
        found: true,
        ...info,
      };
    }),
});
