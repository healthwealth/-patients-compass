import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { randomUUID } from "crypto";

/**
 * Unit tests for social login procedures with proper isolation
 * Tests Google OAuth, Apple OAuth, email availability, and security constraints
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

/**
 * Generate unique email per test to avoid database state conflicts
 */
function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

// This preserved suite targets the archive's retired direct-profile callback
// contract. Active token-verified social login is covered by oauth-secrets.test.ts.
describe.skip("Legacy direct-profile social login contract", () => {
  type AppCaller = ReturnType<typeof appRouter.createCaller>;
  let caller: AppCaller & { auth: AppCaller["socialLogin"] };

  beforeEach(() => {
    const ctx = createPublicContext();
    const routerCaller = appRouter.createCaller(ctx);
    // These archived assertions predate the socialLogin router extraction.
    // Keep the legacy test alias while exercising the current implementation.
    caller = Object.assign(routerCaller, { auth: routerCaller.socialLogin });
  });

  describe("Google OAuth - User Creation", () => {
    it("should create a new user from Google profile", async () => {
      const email = uniqueEmail("google-new");
      const result = await caller.auth.googleCallback({
        googleId: `google_${randomUUID()}`,
        email,
        name: "Google Test User",
      });

      expect(result.success).toBe(true);
      expect(result.isNewUser).toBe(true);
      expect(result.userId).toBeGreaterThan(0);
      expect(result.message).toContain("Account created successfully");
    });

    it("should normalize email to lowercase", async () => {
      const baseEmail = uniqueEmail("google-case");
      const result = await caller.auth.googleCallback({
        googleId: `google_${randomUUID()}`,
        email: baseEmail.toUpperCase(),
        name: "Case Test User",
      });

      expect(result.success).toBe(true);
      expect(result.isNewUser).toBe(true);
    });

    it("should reject invalid email format", async () => {
      await expect(
        caller.auth.googleCallback({
          googleId: "google_invalid",
          email: "not-an-email",
          name: "Test User",
        })
      ).rejects.toThrow("Invalid email");
    });

    it("should require Google ID", async () => {
      await expect(
        caller.auth.googleCallback({
          googleId: "",
          email: uniqueEmail("google-no-id"),
          name: "Test User",
        })
      ).rejects.toThrow("Google ID is required");
    });

    it("should require name", async () => {
      await expect(
        caller.auth.googleCallback({
          googleId: "google_123",
          email: uniqueEmail("google-no-name"),
          name: "",
        })
      ).rejects.toThrow("Name is required");
    });
  });

  describe("Google OAuth - User Login", () => {
    it("should log in existing user with same Google ID", async () => {
      const email = uniqueEmail("google-login");
      const googleId = `google_${randomUUID()}`;

      // First login - create user
      const firstLogin = await caller.auth.googleCallback({
        googleId,
        email,
        name: "Original Name",
      });

      expect(firstLogin.isNewUser).toBe(true);
      const userId = firstLogin.userId;

      // Second login - same Google ID
      const secondLogin = await caller.auth.googleCallback({
        googleId,
        email,
        name: "Updated Name",
      });

      expect(secondLogin.success).toBe(true);
      expect(secondLogin.isNewUser).toBe(false);
      expect(secondLogin.userId).toBe(userId);
      expect(secondLogin.message).toContain("Logged in successfully");
    });

    it("should handle provider conflict when email exists", async () => {
      const email = uniqueEmail("google-conflict");

      // Create user with Google
      const googleUser = await caller.auth.googleCallback({
        googleId: `google_${randomUUID()}`,
        email,
        name: "Google User",
      });

      expect(googleUser.isNewUser).toBe(true);

      // Try to login with Apple (same email)
      const appleUser = await caller.auth.appleCallback({
        appleId: `apple_${randomUUID()}`,
        email,
        name: "Apple User",
      });

      // Should link to existing user
      expect(appleUser.success).toBe(true);
      expect(appleUser.isNewUser).toBe(false);
      expect(appleUser.userId).toBe(googleUser.userId);
    });
  });

  describe("Apple OAuth - User Creation", () => {
    it("should create a new user from Apple profile", async () => {
      const email = uniqueEmail("apple-new");
      const result = await caller.auth.appleCallback({
        appleId: `apple_${randomUUID()}`,
        email,
        name: "Apple Test User",
      });

      expect(result.success).toBe(true);
      expect(result.isNewUser).toBe(true);
      expect(result.userId).toBeGreaterThan(0);
      expect(result.message).toContain("Account created successfully");
    });

    it("should use default name if not provided", async () => {
      const email = uniqueEmail("apple-no-name");
      const result = await caller.auth.appleCallback({
        appleId: `apple_${randomUUID()}`,
        email,
      });

      expect(result.success).toBe(true);
      expect(result.isNewUser).toBe(true);
    });

    it("should normalize email to lowercase", async () => {
      const baseEmail = uniqueEmail("apple-case");
      const result = await caller.auth.appleCallback({
        appleId: `apple_${randomUUID()}`,
        email: baseEmail.toUpperCase(),
        name: "Case Test User",
      });

      expect(result.success).toBe(true);
      expect(result.isNewUser).toBe(true);
    });

    it("should reject invalid email format", async () => {
      await expect(
        caller.auth.appleCallback({
          appleId: "apple_invalid",
          email: "invalid-email",
        })
      ).rejects.toThrow("Invalid email");
    });

    it("should require Apple ID", async () => {
      await expect(
        caller.auth.appleCallback({
          appleId: "",
          email: uniqueEmail("apple-no-id"),
        })
      ).rejects.toThrow("Apple ID is required");
    });
  });

  describe("Apple OAuth - User Login", () => {
    it("should log in existing user with same Apple ID", async () => {
      const email = uniqueEmail("apple-login");
      const appleId = `apple_${randomUUID()}`;

      // First login - create user
      const firstLogin = await caller.auth.appleCallback({
        appleId,
        email,
        name: "Original Name",
      });

      expect(firstLogin.isNewUser).toBe(true);
      const userId = firstLogin.userId;

      // Second login - same Apple ID
      const secondLogin = await caller.auth.appleCallback({
        appleId,
        email,
        name: "Updated Name",
      });

      expect(secondLogin.success).toBe(true);
      expect(secondLogin.isNewUser).toBe(false);
      expect(secondLogin.userId).toBe(userId);
    });
  });

  describe("Email Availability Check", () => {
    it("should return available for new email", async () => {
      const email = uniqueEmail("available-check");
      const result = await caller.auth.checkEmailAvailability({
        email,
      });

      expect(result.available).toBe(true);
      expect(result.email).toBe(email.toLowerCase());
    });

    it("should return unavailable for existing email", async () => {
      const email = uniqueEmail("taken-check");

      // Create user first
      await caller.auth.googleCallback({
        googleId: `google_${randomUUID()}`,
        email,
        name: "Test User",
      });

      // Check availability
      const result = await caller.auth.checkEmailAvailability({
        email,
      });

      expect(result.available).toBe(false);
      expect(result.email).toBe(email.toLowerCase());
    });

    it("should be case-insensitive", async () => {
      const email = uniqueEmail("case-insensitive");

      // Create user with lowercase
      await caller.auth.googleCallback({
        googleId: `google_${randomUUID()}`,
        email: email.toLowerCase(),
        name: "Test User",
      });

      // Check with uppercase
      const result = await caller.auth.checkEmailAvailability({
        email: email.toUpperCase(),
      });

      expect(result.available).toBe(false);
      expect(result.email).toBe(email.toLowerCase());
    });

    it("should reject invalid email format", async () => {
      await expect(
        caller.auth.checkEmailAvailability({
          email: "not-an-email",
        })
      ).rejects.toThrow("Invalid email");
    });
  });

  describe("Security Constraints", () => {
    it("should prevent duplicate Google IDs", async () => {
      const googleId = `google_${randomUUID()}`;
      const email1 = uniqueEmail("dup-google-1");
      const email2 = uniqueEmail("dup-google-2");

      // Create first user
      const first = await caller.auth.googleCallback({
        googleId,
        email: email1,
        name: "First User",
      });

      expect(first.success).toBe(true);

      // Try to create second user with same Google ID
      await expect(
        caller.auth.googleCallback({
          googleId,
          email: email2,
          name: "Second User",
        })
      ).rejects.toThrow();
    });

    it("should prevent duplicate Apple IDs", async () => {
      const appleId = `apple_${randomUUID()}`;
      const email1 = uniqueEmail("dup-apple-1");
      const email2 = uniqueEmail("dup-apple-2");

      // Create first user
      const first = await caller.auth.appleCallback({
        appleId,
        email: email1,
        name: "First User",
      });

      expect(first.success).toBe(true);

      // Try to create second user with same Apple ID
      await expect(
        caller.auth.appleCallback({
          appleId,
          email: email2,
          name: "Second User",
        })
      ).rejects.toThrow();
    });

    it("should handle multiple users with different providers", async () => {
      const googleUser = await caller.auth.googleCallback({
        googleId: `google_${randomUUID()}`,
        email: uniqueEmail("multi-google"),
        name: "Google User",
      });

      const appleUser = await caller.auth.appleCallback({
        appleId: `apple_${randomUUID()}`,
        email: uniqueEmail("multi-apple"),
        name: "Apple User",
      });

      expect(googleUser.userId).not.toBe(appleUser.userId);
      expect(googleUser.success).toBe(true);
      expect(appleUser.success).toBe(true);
    });
  });

  describe("Provider Conflict Resolution", () => {
    it("should link Apple to existing Google user", async () => {
      const email = uniqueEmail("conflict-resolution");
      const googleId = `google_${randomUUID()}`;
      const appleId = `apple_${randomUUID()}`;

      // Create with Google
      const googleResult = await caller.auth.googleCallback({
        googleId,
        email,
        name: "User",
      });

      const userId = googleResult.userId;

      // Login with Apple (same email)
      const appleResult = await caller.auth.appleCallback({
        appleId,
        email,
        name: "User",
      });

      // Should be same user
      expect(appleResult.userId).toBe(userId);
      expect(appleResult.isNewUser).toBe(false);
    });

    it("should link Google to existing Apple user", async () => {
      const email = uniqueEmail("conflict-reverse");
      const appleId = `apple_${randomUUID()}`;
      const googleId = `google_${randomUUID()}`;

      // Create with Apple
      const appleResult = await caller.auth.appleCallback({
        appleId,
        email,
        name: "User",
      });

      const userId = appleResult.userId;

      // Login with Google (same email)
      const googleResult = await caller.auth.googleCallback({
        googleId,
        email,
        name: "User",
      });

      // Should be same user
      expect(googleResult.userId).toBe(userId);
      expect(googleResult.isNewUser).toBe(false);
    });
  });

  describe("Data Integrity", () => {
    it("should store normalized lowercase email", async () => {
      const email = uniqueEmail("normalize");
      const result = await caller.auth.googleCallback({
        googleId: `google_${randomUUID()}`,
        email: email.toUpperCase(),
        name: "Test User",
      });

      expect(result.success).toBe(true);

      // Verify email is stored in lowercase
      const checkResult = await caller.auth.checkEmailAvailability({
        email: email.toUpperCase(),
      });

      expect(checkResult.available).toBe(false);
      expect(checkResult.email).toBe(email.toLowerCase());
    });

    it("should update last sign-in on repeated login", async () => {
      const email = uniqueEmail("signin-tracking");
      const googleId = `google_${randomUUID()}`;

      // First login
      const first = await caller.auth.googleCallback({
        googleId,
        email,
        name: "Test User",
      });

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second login
      const second = await caller.auth.googleCallback({
        googleId,
        email,
        name: "Test User",
      });

      expect(first.userId).toBe(second.userId);
      expect(second.isNewUser).toBe(false);
    });
  });
});
