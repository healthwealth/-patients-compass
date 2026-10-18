import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Create a mock context for public procedures
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

describe("faq router", () => {
  it("should return all FAQ items", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.faq.getAll();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return FAQ categories", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.faq.getCategories();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should search FAQ items by query", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.faq.search({ query: "lab" });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get FAQ items by category", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.faq.getByCategory({ category: "getting-started" });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get category display name", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.faq.getCategoryName({ category: "getting-started" });

    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("should mark FAQ item as helpful", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.faq.markHelpful({
      faqId: "test-faq-1",
      helpful: true,
    });

    expect(result.success).toBe(true);
  });

  it("should report FAQ item as unhelpful", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.faq.reportUnhelpful({
      faqId: "test-faq-1",
      reason: "This answer was not helpful",
      userEmail: "test@example.com",
    });

    expect(result.success).toBe(true);
  });
});
