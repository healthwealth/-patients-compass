import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";

vi.mock("./db", () => ({ getDb: vi.fn() }));

// Mock the LLM to return a valid assistant response
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content:
            "This is an educational response about your health question. Please consult your healthcare provider for personalized medical advice.",
        },
      },
    ],
  }),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── medicalAssistant.chat ────────────────────────────────────────────────────

describe("medicalAssistant.chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts health_assistant mode and returns assistant response", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.medicalAssistant.chat({
      mode: "health_assistant",
      messages: [{ role: "user", content: "What is ferritin?" }],
    });

    expect(result).toBeDefined();
    expect(result.role).toBe("assistant");
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.mode).toBe("health_assistant");
  });

  it("accepts lab_analyzer mode and returns assistant response", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.medicalAssistant.chat({
      mode: "lab_analyzer",
      messages: [
        { role: "user", content: "My ferritin is 24 ng/mL. Is that good?" },
      ],
    });

    expect(result).toBeDefined();
    expect(result.role).toBe("assistant");
    expect(result.mode).toBe("lab_analyzer");
    expect(typeof result.content).toBe("string");
  });

  it("accepts nutrition_coach mode and returns assistant response", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.medicalAssistant.chat({
      mode: "nutrition_coach",
      messages: [
        {
          role: "user",
          content: "What foods help increase ferritin levels?",
        },
      ],
    });

    expect(result).toBeDefined();
    expect(result.role).toBe("assistant");
    expect(result.mode).toBe("nutrition_coach");
  });

  it("rejects an invalid mode", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.medicalAssistant.chat({
        mode: "invalid_mode" as any,
        messages: [{ role: "user", content: "Hello" }],
      })
    ).rejects.toThrow();
  });

  it("rejects an empty messages array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.medicalAssistant.chat({
        mode: "health_assistant",
        messages: [],
      })
    ).rejects.toThrow();
  });

  it("rejects a messages array exceeding 20 items", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const tooManyMessages = Array.from({ length: 21 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `Message ${i + 1}`,
    }));

    await expect(
      caller.medicalAssistant.chat({
        mode: "health_assistant",
        messages: tooManyMessages,
      })
    ).rejects.toThrow();
  });

  it("is accessible without authentication (public procedure)", async () => {
    // Public context with no user
    const ctx = createPublicContext();
    expect(ctx.user).toBeNull();

    const caller = appRouter.createCaller(ctx);

    // Should not throw an auth error
    const result = await caller.medicalAssistant.chat({
      mode: "health_assistant",
      messages: [{ role: "user", content: "Can I use this without logging in?" }],
    });

    expect(result.role).toBe("assistant");
  });

  it("requires authentication before accepting a document attachment", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.medicalAssistant.chat({
      mode: "health_assistant",
      messages: [{ role: "user", content: "Explain this document." }],
      attachment: { fileName: "notes.txt", contentType: "text/plain", dataBase64: Buffer.from("sample notes").toString("base64") },
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("requires authentication for extracted-text preview", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.medicalAssistant.previewDocument({
      fileName: "notes.txt",
      contentType: "text/plain",
      dataBase64: Buffer.from("Preview this safely.").toString("base64"),
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("previews bounded extracted text without invoking the model or consuming quota", async () => {
    const caller = appRouter.createCaller({ ...createPublicContext(), user: { id: 1, role: "user" } } as never);
    const result = await caller.medicalAssistant.previewDocument({
      fileName: "visit-notes.txt",
      contentType: "text/plain",
      dataBase64: Buffer.from("Bring the medication list to the appointment.").toString("base64"),
    });
    expect(result).toMatchObject({ fileName: "visit-notes.txt", truncated: false });
    expect(result.text).toContain("Bring the medication list");
    expect(result.characterCount).toBeGreaterThan(10);
    expect(invokeLLM).not.toHaveBeenCalled();
    expect(getDb).not.toHaveBeenCalled();
  });

  it("adds extracted document text only to the authenticated LLM request", async () => {
    const limit = vi.fn().mockResolvedValue([{ subscriptionStatus: "active", aiQueryCount: 0, aiQueryDate: null }]);
    vi.mocked(getDb).mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })) } as never);
    const caller = appRouter.createCaller({ ...createPublicContext(), user: { id: 1, role: "admin" } } as never);
    await caller.medicalAssistant.chat({
      mode: "health_assistant",
      messages: [{ role: "user", content: "Summarize the key point." }],
      attachment: { fileName: "visit-notes.txt", contentType: "text/plain", dataBase64: Buffer.from("Bring the medication list to the appointment.").toString("base64") },
    });
    const call = vi.mocked(invokeLLM).mock.calls.at(-1)?.[0];
    expect(call?.messages.at(-1)?.content).toContain("Bring the medication list");
    expect(call?.messages.at(-1)?.content).toContain("untrusted reference text");
  });

  it("rejects invalid document base64 without invoking the model", async () => {
    const limit = vi.fn().mockResolvedValue([{ subscriptionStatus: "active", aiQueryCount: 0, aiQueryDate: null }]);
    vi.mocked(getDb).mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit })) })) })) } as never);
    const caller = appRouter.createCaller({ ...createPublicContext(), user: { id: 1, role: "admin" } } as never);
    await expect(caller.medicalAssistant.chat({ mode: "health_assistant", messages: [{ role: "user", content: "Read this." }], attachment: { fileName: "notes.txt", contentType: "text/plain", dataBase64: "not-base64!" } })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(getDb).not.toHaveBeenCalled();
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it("handles multi-turn conversation history", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.medicalAssistant.chat({
      mode: "lab_analyzer",
      messages: [
        { role: "user", content: "My TSH is 3.4 mIU/L." },
        {
          role: "assistant",
          content:
            "A TSH of 3.4 is within the standard range but may be suboptimal.",
        },
        {
          role: "user",
          content: "What questions should I ask my doctor about this?",
        },
      ],
    });

    expect(result).toBeDefined();
    expect(result.role).toBe("assistant");
    expect(result.mode).toBe("lab_analyzer");
  });

  it("returns response shape with role, content, and mode fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.medicalAssistant.chat({
      mode: "nutrition_coach",
      messages: [{ role: "user", content: "How does diet affect inflammation?" }],
    });

    expect(result).toHaveProperty("role");
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("mode");
    expect(["health_assistant", "lab_analyzer", "nutrition_coach"]).toContain(
      result.mode
    );
  });
});
