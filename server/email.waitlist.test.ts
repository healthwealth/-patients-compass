import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Mock the database helper and notification helper ──────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    subscribeEmail: vi.fn(),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/email", () => ({
  sendWaitlistConfirmation: vi.fn().mockResolvedValue(true),
}));

import { subscribeEmail } from "./db";
import { notifyOwner } from "./_core/notification";

// ── Minimal public context (no user required) ─────────────────────────────────
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("email.joinWaitlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the email with source=signin_waitlist and notifies the owner for a new entry", async () => {
    vi.mocked(subscribeEmail).mockResolvedValue({
      success: true,
      alreadySubscribed: false,
    });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.email.joinWaitlist({ email: "new@example.com" });

    expect(result).toEqual({ success: true, alreadySubscribed: false });
    expect(subscribeEmail).toHaveBeenCalledWith({
      email: "new@example.com",
      source: "signin_waitlist",
    });
    expect(notifyOwner).toHaveBeenCalledOnce();
    expect(notifyOwner).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New Sign-In Waitlist Entry" })
    );
  });

  it("does NOT notify the owner when the email is already on the waitlist", async () => {
    vi.mocked(subscribeEmail).mockResolvedValue({
      success: true,
      alreadySubscribed: true,
    });

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.email.joinWaitlist({ email: "existing@example.com" });

    expect(result).toEqual({ success: true, alreadySubscribed: true });
    expect(notifyOwner).not.toHaveBeenCalled();
  });

  it("rejects invalid email addresses", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.email.joinWaitlist({ email: "not-an-email" })
    ).rejects.toThrow();
  });
});
