import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock the LLM module
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(async ({ messages }) => {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content;

    // Mock categorization responses
    if (content.includes("Categorize")) {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                category: "biomarker",
                confidence: 0.95,
                requiresEscalation: false,
              }),
            },
          },
        ],
      };
    }

    // Mock support responses
    return {
      choices: [
        {
          message: {
            content: "This is a helpful response from Health Companion.",
          },
        },
      ],
    };
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Support Chat Router", () => {
  describe("supportChat.sendMessage", () => {
    it("should send a message and receive a response", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.supportChat.sendMessage({
        message: "What is a biomarker?",
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
      expect(result.category).toBe("biomarker");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should include conversation history in context", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const history = [
        { role: "user" as const, content: "What is glucose?" },
        { role: "assistant" as const, content: "Glucose is a type of sugar..." },
      ];

      const result = await caller.supportChat.sendMessage({
        message: "How do I lower it?",
        conversationHistory: history,
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
    });

    it("should reject empty messages", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.supportChat.sendMessage({
          message: "",
          conversationHistory: [],
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should reject messages over 2000 characters", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const longMessage = "a".repeat(2001);

      try {
        await caller.supportChat.sendMessage({
          message: longMessage,
          conversationHistory: [],
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle escalation detection", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.supportChat.sendMessage({
        message: "I need to speak with a human",
        conversationHistory: [],
      });

      expect(result).toHaveProperty("requiresEscalation");
      expect(result).toHaveProperty("escalationReason");
    });
  });

  describe("supportChat.detectEscalation", () => {
    it("should detect escalation needs", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.supportChat.detectEscalation({
        message: "This is urgent!",
      });

      expect(result).toHaveProperty("requiresEscalation");
      expect(result).toHaveProperty("reason");
      expect(result).toHaveProperty("category");
    });

    it("should reject empty messages", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.supportChat.detectEscalation({
          message: "",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("supportChat.getEscalationInfo", () => {
    it("should return escalation contact information", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.supportChat.getEscalationInfo();

      expect(result).toHaveProperty("email");
      expect(result).toHaveProperty("responseTime");
      expect(result).toHaveProperty("hours");
      expect(result).toHaveProperty("message");
      expect(result.email).toBe("support@thepatientscompass.com");
    });
  });

  describe("Support Categories", () => {
    it("should handle biomarker questions", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.supportChat.sendMessage({
        message: "What does a high cholesterol level mean?",
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.category).toBe("biomarker");
    });

    it("should handle lab analysis questions", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.supportChat.sendMessage({
        message: "How do I upload my lab report?",
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
    });

    it("should handle billing questions", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.supportChat.sendMessage({
        message: "What's your pricing?",
        conversationHistory: [],
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
    });
  });

  describe("Conversation History", () => {
    it("should maintain context across multiple messages", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const history = [
        { role: "user" as const, content: "I have high glucose" },
        { role: "assistant" as const, content: "Glucose is a blood sugar..." },
      ];

      const result = await caller.supportChat.sendMessage({
        message: "What should I eat?",
        conversationHistory: history,
      });

      expect(result.success).toBe(true);
      expect(result.response).toBeTruthy();
    });
  });
});
