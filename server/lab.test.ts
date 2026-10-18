import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module to avoid real DB calls in tests
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    subscribeEmail: vi.fn(),
    createLabReport: vi.fn(),
    updateLabReport: vi.fn(),
    getLabReportsByUser: vi.fn(),
    getLabReportById: vi.fn(),
    saveBiomarkerReading: vi.fn(),
    getBiomarkerHistory: vi.fn(),
  };
});

// Mock the LLM to avoid real API calls
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            biomarkers: [
              {
                name: "Ferritin",
                value: 24,
                unit: "ng/mL",
                standardRange: "15-150 ng/mL",
                optimalRange: "50-100 ng/mL",
                status: "suboptimal",
                interpretation: "Low iron stores",
                recommendation: "Consider iron supplementation",
              },
            ],
            overallAssessment: "Several biomarkers are suboptimal.",
            keyFindings: ["Low Ferritin"],
            doctorDiscussionPoints: ["Discuss iron supplementation"],
            disclaimer: "This is for educational purposes only.",
          }),
        },
      },
    ],
  }),
}));

// Keep the admin authorization test offline and deterministic.
vi.mock("./_core/email", () => ({
  sendBulkReEngagement: vi.fn().mockResolvedValue({ sent: 2, failed: 0 }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(undefined),
}));

import * as db from "./db";

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

describe("lab.analyzeText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("analyzes lab text and returns structured biomarker data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lab.analyzeText({
      text: "Ferritin: 24 ng/mL (Ref: 15-150)",
      fileName: "test_report.txt",
    });

    expect(result).toBeDefined();
    expect(result.biomarkers).toBeInstanceOf(Array);
    expect(result.biomarkers.length).toBeGreaterThan(0);
    expect(result.biomarkers[0]).toMatchObject({
      name: "Ferritin",
      value: 24,
      unit: "ng/mL",
    });
    expect(result.overallAssessment).toBeTruthy();
    expect(result.disclaimer).toBeTruthy();
  });
});

describe("lab.save", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves a lab report for authenticated users", async () => {
    const mockCreateLabReport = vi.mocked(db.createLabReport);
    const mockUpdateLabReport = vi.mocked(db.updateLabReport);
    const mockSaveBiomarkerReading = vi.mocked(db.saveBiomarkerReading);

    const fakeReport = { id: 1, userId: 42, fileName: "test.txt", status: "pending" };
    const fakeUpdated = { ...fakeReport, status: "completed", analysisResult: {} };

    mockCreateLabReport.mockResolvedValue(fakeReport as any);
    mockUpdateLabReport.mockResolvedValue(fakeUpdated as any);
    mockSaveBiomarkerReading.mockResolvedValue({} as any);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const analysisResult = {
      biomarkers: [{ name: "Ferritin", value: 24, unit: "ng/mL" }],
      overallAssessment: "Test",
      keyFindings: [],
      doctorDiscussionPoints: [],
      disclaimer: "Educational only.",
    };

    const result = await caller.lab.save({
      fileName: "test.txt",
      rawText: "Ferritin: 24 ng/mL",
      analysisResult,
    });

    expect(mockCreateLabReport).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 42, fileName: "test.txt" })
    );
    expect(mockUpdateLabReport).toHaveBeenCalled();
    expect(mockSaveBiomarkerReading).toHaveBeenCalled();
  });

  it("requires authentication to save a lab report", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.lab.save({
        fileName: "test.txt",
        rawText: "Ferritin: 24 ng/mL",
        analysisResult: {},
      })
    ).rejects.toThrow();
  });
});

describe("lab.list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns lab reports for authenticated user", async () => {
    const mockGetLabReportsByUser = vi.mocked(db.getLabReportsByUser);
    mockGetLabReportsByUser.mockResolvedValue([
      { id: 1, userId: 42, fileName: "report1.txt", status: "completed" } as any,
      { id: 2, userId: 42, fileName: "report2.pdf", status: "completed" } as any,
    ]);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.lab.list();

    expect(result).toHaveLength(2);
    expect(mockGetLabReportsByUser).toHaveBeenCalledWith(42);
  });

  it("requires authentication to list lab reports", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.lab.list()).rejects.toThrow();
  });
});

// ─── Admin Procedure Enforcement Tests ───────────────────────────────────────

// Extend the DB mock to include waitlist helpers used by the email router
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    subscribeEmail: vi.fn(),
    createLabReport: vi.fn(),
    updateLabReport: vi.fn(),
    getLabReportsByUser: vi.fn(),
    getLabReportById: vi.fn(),
    saveBiomarkerReading: vi.fn(),
    getBiomarkerHistory: vi.fn(),
    getWaitlistEntries: vi.fn().mockResolvedValue([]),
    getWaitlistCount: vi.fn().mockResolvedValue(0),
  };
});

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
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

describe("email.waitlistEntries — adminProcedure enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns waitlist entries for admin users", async () => {
    const mockGetWaitlistEntries = vi.mocked(db.getWaitlistEntries);
    mockGetWaitlistEntries.mockResolvedValue([
      { id: 1, email: "user@example.com", name: "Test User", source: "signin_waitlist", createdAt: new Date() } as any,
    ]);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.email.waitlistEntries();
    expect(result).toHaveLength(1);
    expect(mockGetWaitlistEntries).toHaveBeenCalledOnce();
  });

  it("throws FORBIDDEN for non-admin authenticated users", async () => {
    const ctx = createAuthContext(); // role: "user"
    const caller = appRouter.createCaller(ctx);

    await expect(caller.email.waitlistEntries()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("throws FORBIDDEN for unauthenticated users", async () => {
    const ctx = createPublicContext(); // user: null
    const caller = appRouter.createCaller(ctx);

    await expect(caller.email.waitlistEntries()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("email.notifyAllWaitlist — adminProcedure enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws FORBIDDEN for non-admin authenticated users", async () => {
    const ctx = createAuthContext(); // role: "user"
    const caller = appRouter.createCaller(ctx);

    await expect(caller.email.notifyAllWaitlist()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("throws FORBIDDEN for unauthenticated users", async () => {
    const ctx = createPublicContext(); // user: null
    const caller = appRouter.createCaller(ctx);

    await expect(caller.email.notifyAllWaitlist()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("executes for admin users and returns sent count", async () => {
    const mockGetWaitlistEntries = vi.mocked(db.getWaitlistEntries);
    mockGetWaitlistEntries.mockResolvedValue([
      { id: 1, email: "user1@example.com", name: "User One", source: "signin_waitlist", createdAt: new Date() } as any,
      { id: 2, email: "user2@example.com", name: "User Two", source: "signin_waitlist", createdAt: new Date() } as any,
    ]);

    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.email.notifyAllWaitlist();
    expect(result).toHaveProperty("count");
    expect(result.count).toBe(2);
  });
});
