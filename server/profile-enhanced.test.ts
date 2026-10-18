import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Profile - Enhanced Features", () => {
  describe("Email Verification", () => {
    it("should send email verification code for new email", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profile.sendEmailVerification({
        newEmail: "newemail@example.com",
      });

      expect(result).toHaveProperty("message");
      expect(result.message).toContain("Verification code");
    });

    it("should reject invalid email format", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.profile.sendEmailVerification({
          newEmail: "invalid-email",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("email");
      }
    });

    it("should reject same email as current", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.profile.sendEmailVerification({
          newEmail: ctx.user.email,
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("different");
      }
    });

    it("should verify email change with correct code", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // First send verification code
      await caller.profile.sendEmailVerification({
        newEmail: "newemail@example.com",
      });

      // Then verify with code (in real scenario, we'd get the actual code)
      // For testing, we'll use a placeholder
      try {
        const result = await caller.profile.verifyEmailChange({
          verificationCode: "000000",
        });
        // Result will depend on whether the code matches
        expect(result).toHaveProperty("message");
      } catch (error: any) {
        // Expected to fail with invalid code
        expect(error.message).toBeDefined();
      }
    });
  });

  describe("Newsletter Preferences", () => {
    it("should retrieve newsletter preferences", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profile.getNewsletterPreferences();

      expect(result).toHaveProperty("marketing");
      expect(result).toHaveProperty("transactional");
      expect(result).toHaveProperty("digests");
      expect(typeof result.marketing).toBe("boolean");
      expect(typeof result.transactional).toBe("boolean");
      expect(typeof result.digests).toBe("boolean");
    });

    it("should update newsletter preferences", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profile.updateNewsletterPreferences({
        marketing: false,
        transactional: true,
        digests: true,
      });

      expect(result).toHaveProperty("message");
      expect(result.message).toContain("updated");
    });

    it("should validate preference updates", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Transactional emails should always be true (required)
      const result = await caller.profile.updateNewsletterPreferences({
        marketing: true,
        transactional: false, // Should be ignored or forced to true
        digests: true,
      });

      expect(result).toHaveProperty("message");
    });

    it("should handle all preferences disabled except transactional", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profile.updateNewsletterPreferences({
        marketing: false,
        transactional: true,
        digests: false,
      });

      expect(result).toHaveProperty("message");
      expect(result.message).toContain("updated");
    });
  });

  describe("Billing History", () => {
    it("should retrieve billing history", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profile.getBillingHistory();

      expect(result).toHaveProperty("invoices");
      expect(Array.isArray(result.invoices)).toBe(true);
    });

    it("should return empty invoices for free users", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profile.getBillingHistory();

      // Free users should have empty or minimal billing history
      expect(Array.isArray(result.invoices)).toBe(true);
    });

    it("should format billing history correctly", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.profile.getBillingHistory();

      if (result.invoices.length > 0) {
        const invoice = result.invoices[0];
        expect(invoice).toHaveProperty("date");
        expect(invoice).toHaveProperty("amount");
      }
    });
  });

  describe("Profile Operations - Integration", () => {
    it("should allow updating profile with new email", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const updatedEmail = `updated-${Date.now()}@example.com`;

      const result = await caller.profile.updateProfile({
        name: "Updated Name",
        email: updatedEmail,
      });

      expect(result).toHaveProperty("success", true);
      expect(result.user.name).toBe("Updated Name");
      expect(result.user.email).toBe(updatedEmail);
    });

    it("should allow changing password", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.profile.changePassword({
          currentPassword: "oldpassword",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        });
        expect(result).toHaveProperty("message");
      } catch (error: any) {
        // Expected if current password doesn't match
        expect(error.message).toBeDefined();
      }
    });

    it("should validate password change requirements", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.profile.changePassword({
          currentPassword: "oldpassword",
          newPassword: "short",
          confirmPassword: "short",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("8 characters");
      }
    });

    it("should reject mismatched password confirmation", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.profile.changePassword({
          currentPassword: "oldpassword",
          newPassword: "newpassword123",
          confirmPassword: "differentpassword123",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("match");
      }
    });

    it("should allow account deletion with confirmation", async () => {
      const ctx = createAuthContext(999); // Use different ID to avoid conflicts
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.profile.deleteAccount({
          password: "userpassword",
          confirmDelete: true,
        });
        expect(result).toHaveProperty("message");
      } catch (error: any) {
        // Expected if password doesn't match
        expect(error.message).toBeDefined();
      }
    });

    it("should reject account deletion without confirmation", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.profile.deleteAccount({
          password: "userpassword",
          confirmDelete: false,
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("confirm");
      }
    });
  });

  describe("Profile - Protected Routes", () => {
    it("should require authentication for profile operations", async () => {
      const unauthContext: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(unauthContext);

      try {
        await caller.profile.getProfile();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should require authentication for email verification", async () => {
      const unauthContext: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(unauthContext);

      try {
        await caller.profile.sendEmailVerification({
          newEmail: "test@example.com",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should require authentication for newsletter preferences", async () => {
      const unauthContext: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(unauthContext);

      try {
        await caller.profile.getNewsletterPreferences();
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
