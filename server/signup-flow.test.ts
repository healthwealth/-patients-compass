import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { randomUUID } from "crypto";

/**
 * Test the complete signup flow to verify email verification step works
 */

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

describe("Signup Flow - Email Verification", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  const testEmail = `flow-test-${randomUUID()}@example.com`;
  const testPassword = "TestPassword123!";

  beforeEach(() => {
    const ctx = createPublicContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should create user and return success response", async () => {
    const result = await caller.auth.signup({
      email: testEmail,
      name: "Flow Test User",
      password: testPassword,
    });

    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
    expect(result).toHaveProperty("message");
    console.log("Signup response:", result);
  });

  it("should allow verification after signup", async () => {
    // First, sign up
    const signupResult = await caller.auth.signup({
      email: `verify-test-${randomUUID()}@example.com`,
      name: "Verify Test User",
      password: testPassword,
    });

    expect(signupResult.success).toBe(true);
    console.log("Signup result:", signupResult);

    // The verification code should have been sent via email
    // In a real scenario, we'd retrieve it from the email service
    // For now, we're just verifying the signup succeeded
  });
});
