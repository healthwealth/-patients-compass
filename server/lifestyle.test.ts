import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module to avoid real DB calls in tests
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    createHealthNote: vi.fn(),
    getHealthNotesByUser: vi.fn(),
    deleteHealthNote: vi.fn(),
  };
});

// Mock the LLM to return a valid lifestyle recommendations payload
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            summary:
              "Your biomarker profile suggests suboptimal iron stores and elevated inflammation markers. Focusing on iron-rich foods and anti-inflammatory lifestyle practices may support your wellness goals.",
            nutritionFocus: {
              headline: "Prioritize Iron-Rich and Anti-Inflammatory Foods",
              items: [
                {
                  title: "Iron-Rich Plant Foods",
                  description: "Boost iron absorption with plant-based sources paired with vitamin C.",
                  foods: ["lentils", "spinach", "pumpkin seeds", "quinoa"],
                },
                {
                  title: "Omega-3 Fatty Acids",
                  description: "Support healthy inflammatory response with omega-3 rich foods.",
                  foods: ["salmon", "sardines", "walnuts", "flaxseed"],
                },
              ],
            },
            lifestyleFocus: {
              headline: "Support Recovery and Reduce Systemic Stress",
              items: [
                {
                  category: "sleep",
                  title: "Prioritize 7–9 Hours of Quality Sleep",
                  description:
                    "Sleep is when the body repairs tissue and regulates inflammatory pathways.",
                  actionSteps: [
                    "Maintain a consistent sleep schedule",
                    "Avoid screens 1 hour before bed",
                    "Keep bedroom cool and dark",
                  ],
                },
                {
                  category: "movement",
                  title: "Gentle Daily Movement",
                  description:
                    "Low-impact exercise supports circulation and helps regulate blood sugar.",
                  actionSteps: [
                    "30-minute daily walk",
                    "Yoga or stretching 3x per week",
                    "Avoid high-intensity exercise when fatigued",
                  ],
                },
              ],
            },
            biomarkerHabits: [
              {
                biomarkerName: "Ferritin (Iron Storage)",
                habit: "Pair iron-rich foods with vitamin C sources at each meal",
                rationale:
                  "Vitamin C significantly enhances non-heme iron absorption from plant foods.",
              },
              {
                biomarkerName: "hs-CRP (Inflammation)",
                habit: "Incorporate turmeric and ginger into daily cooking",
                rationale:
                  "Curcumin in turmeric has well-documented anti-inflammatory properties.",
              },
            ],
            doctorQuestions: [
              "Could my Ferritin level be contributing to my fatigue symptoms?",
              "Would you recommend checking my full iron panel including serum iron and TIBC?",
              "Are there any lifestyle factors you recommend I address first before considering supplementation?",
            ],
            disclaimer:
              "This information is for educational purposes only and is not intended to diagnose, treat, cure, or replace professional medical advice. Always consult your licensed healthcare provider before making health decisions.",
          }),
        },
      },
    ],
  }),
}));

import * as db from "./db";

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

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "test-user-456",
      email: "patient@example.com",
      name: "Test Patient",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── lifestyle.getRecommendations ─────────────────────────────────────────────

describe("lifestyle.getRecommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns structured recommendations for a single biomarker", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lifestyle.getRecommendations({
      biomarkers: [{ name: "Ferritin (Iron Storage)", status: "suboptimal" }],
    });

    expect(result).toBeDefined();
    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it("returns nutritionFocus with headline and items array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lifestyle.getRecommendations({
      biomarkers: [{ name: "Ferritin (Iron Storage)", status: "suboptimal" }],
    });

    expect(result.nutritionFocus).toBeDefined();
    expect(typeof result.nutritionFocus.headline).toBe("string");
    expect(Array.isArray(result.nutritionFocus.items)).toBe(true);
    expect(result.nutritionFocus.items.length).toBeGreaterThan(0);
    expect(result.nutritionFocus.items[0]).toMatchObject({
      title: expect.any(String),
      description: expect.any(String),
      foods: expect.any(Array),
    });
  });

  it("returns lifestyleFocus with headline and items array", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lifestyle.getRecommendations({
      biomarkers: [{ name: "hs-CRP (Inflammation)", status: "high" }],
    });

    expect(result.lifestyleFocus).toBeDefined();
    expect(typeof result.lifestyleFocus.headline).toBe("string");
    expect(Array.isArray(result.lifestyleFocus.items)).toBe(true);
    expect(result.lifestyleFocus.items[0]).toMatchObject({
      category: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      actionSteps: expect.any(Array),
    });
  });

  it("returns biomarkerHabits array with correct shape", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lifestyle.getRecommendations({
      biomarkers: [
        { name: "Ferritin (Iron Storage)", status: "suboptimal" },
        { name: "hs-CRP (Inflammation)", status: "high" },
      ],
    });

    expect(Array.isArray(result.biomarkerHabits)).toBe(true);
    expect(result.biomarkerHabits.length).toBeGreaterThan(0);
    expect(result.biomarkerHabits[0]).toMatchObject({
      biomarkerName: expect.any(String),
      habit: expect.any(String),
      rationale: expect.any(String),
    });
  });

  it("returns doctorQuestions as a non-empty array of strings", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lifestyle.getRecommendations({
      biomarkers: [{ name: "TSH (Thyroid)", status: "high" }],
    });

    expect(Array.isArray(result.doctorQuestions)).toBe(true);
    expect(result.doctorQuestions.length).toBeGreaterThan(0);
    result.doctorQuestions.forEach((q) => expect(typeof q).toBe("string"));
  });

  it("returns a disclaimer string", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lifestyle.getRecommendations({
      biomarkers: [{ name: "HbA1c (Blood Sugar)", status: "high" }],
    });

    expect(typeof result.disclaimer).toBe("string");
    expect(result.disclaimer.length).toBeGreaterThan(0);
  });

  it("accepts optional additionalContext without error", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lifestyle.getRecommendations({
      biomarkers: [{ name: "Vitamin D", status: "suboptimal" }],
      additionalContext: "I am a 45-year-old woman with a vegetarian diet.",
    });

    expect(result).toBeDefined();
    expect(result.summary).toBeTruthy();
  });

  it("accepts biomarkers with optional value and unit fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lifestyle.getRecommendations({
      biomarkers: [
        {
          name: "Ferritin (Iron Storage)",
          status: "suboptimal",
          value: 24,
          unit: "ng/mL",
        },
      ],
    });

    expect(result).toBeDefined();
    expect(result.summary).toBeTruthy();
  });

  it("is accessible to unauthenticated (public) users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw an authentication error
    await expect(
      caller.lifestyle.getRecommendations({
        biomarkers: [{ name: "Ferritin (Iron Storage)", status: "suboptimal" }],
      })
    ).resolves.toBeDefined();
  });

  it("rejects an empty biomarkers array (min 1 validation)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.lifestyle.getRecommendations({
        biomarkers: [],
      })
    ).rejects.toThrow();
  });

  it("rejects additionalContext exceeding 500 characters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const tooLong = "a".repeat(501);

    await expect(
      caller.lifestyle.getRecommendations({
        biomarkers: [{ name: "Ferritin (Iron Storage)", status: "suboptimal" }],
        additionalContext: tooLong,
      })
    ).rejects.toThrow();
  });
});

// ─── healthNotes procedures ───────────────────────────────────────────────────

describe("healthNotes.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a health note for an authenticated user", async () => {
    const mockCreate = vi.mocked(db.createHealthNote);
    mockCreate.mockResolvedValue({
      id: 1,
      userId: 42,
      title: "Energy Improvement",
      category: "lifestyle",
      content: "Feeling more energetic after starting iron-rich diet.",
      noteDate: new Date(),
      createdAt: new Date(),
    } as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.healthNotes.create({
      title: "Energy Improvement",
      category: "lifestyle",
      content: "Feeling more energetic after starting iron-rich diet.",
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 42 })
    );
    expect(result).toBeDefined();
  });

  it("requires authentication to create a health note", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.healthNotes.create({
        title: "Test note",
        category: "other",
      })
    ).rejects.toThrow();
  });
});

describe("healthNotes.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns health notes for an authenticated user", async () => {
    const mockList = vi.mocked(db.getHealthNotesByUser);
    mockList.mockResolvedValue([
      {
        id: 1,
        userId: 42,
        content: "Feeling better",
        noteDate: new Date(),
        createdAt: new Date(),
      } as any,
      {
        id: 2,
        userId: 42,
        content: "Energy levels improving",
        noteDate: new Date(),
        createdAt: new Date(),
      } as any,
    ]);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.healthNotes.list();

    expect(result).toHaveLength(2);
    expect(mockList).toHaveBeenCalledWith(42);
  });

  it("requires authentication to list health notes", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.healthNotes.list()).rejects.toThrow();
  });
});

describe("healthNotes.delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a health note for an authenticated user", async () => {
    const mockDelete = vi.mocked(db.deleteHealthNote);
    mockDelete.mockResolvedValue({ success: true } as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.healthNotes.delete({ id: 1 });

    expect(mockDelete).toHaveBeenCalledWith(1, 42);
    expect(result).toMatchObject({ success: true });
  });

  it("requires authentication to delete a health note", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.healthNotes.delete({ id: 1 })).rejects.toThrow();
  });
});
