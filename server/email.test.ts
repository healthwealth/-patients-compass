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

describe("email.subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes a new email address successfully", async () => {
    const mockSubscribeEmail = vi.mocked(db.subscribeEmail);
    mockSubscribeEmail.mockResolvedValue({ success: true, alreadySubscribed: false });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.email.subscribe({ email: "new@example.com" });

    expect(result.success).toBe(true);
    expect(result.alreadySubscribed).toBe(false);
    expect(mockSubscribeEmail).toHaveBeenCalledWith({
      email: "new@example.com",
      name: undefined,
      source: "landing_page",
    });
  });

  it("returns alreadySubscribed=true for existing email", async () => {
    const mockSubscribeEmail = vi.mocked(db.subscribeEmail);
    mockSubscribeEmail.mockResolvedValue({ success: true, alreadySubscribed: true });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.email.subscribe({ email: "existing@example.com" });

    expect(result.success).toBe(true);
    expect(result.alreadySubscribed).toBe(true);
  });

  it("rejects invalid email addresses", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.email.subscribe({ email: "not-an-email" })
    ).rejects.toThrow();
  });
});
