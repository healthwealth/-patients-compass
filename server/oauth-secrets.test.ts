import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Test suite to validate OAuth secrets (Google Client ID, Apple credentials)
 * These tests verify that the environment variables are properly configured
 * and that token validation works with the correct credentials
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

describe("OAuth Secrets Validation", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createPublicContext();
    caller = appRouter.createCaller(ctx);
    // Reset fetch mock before each test
    vi.clearAllMocks();
  });

  describe("Google OAuth - Secret Validation", () => {
    it("should validate Google Client ID is configured", () => {
      const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;
      expect(googleClientId).toBeDefined();
      expect(googleClientId).toBeTruthy();
      expect(googleClientId).toMatch(/\.apps\.googleusercontent\.com$/);
    });

    it("should reject invalid Google token format", async () => {
      // Mock fetch to simulate Google's tokeninfo endpoint
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "invalid_token" }),
      });

      await expect(
        caller.socialLogin.googleCallback({
          token: "invalid_token_format",
        })
      ).rejects.toThrow();

      expect(global.fetch).toHaveBeenCalled();
    });

    it("should reject token with mismatched audience", async () => {
      // Mock fetch to simulate Google's tokeninfo endpoint returning wrong audience
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          aud: "wrong-client-id.apps.googleusercontent.com",
          sub: "google_123456",
          email: "test@example.com",
          email_verified: true,
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      });

      await expect(
        caller.socialLogin.googleCallback({
          token: "valid_jwt_format_but_wrong_audience",
        })
      ).rejects.toThrow();
    });

    it("should validate token with correct Google Client ID", async () => {
      const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;

      // Mock fetch to simulate successful Google token verification
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          aud: googleClientId,
          sub: "google_test_user_123",
          email: "testuser-oauth-secret@gmail.com",
          email_verified: true,
          exp: Math.floor(Date.now() / 1000) + 3600,
          name: "Test User",
          picture: "https://example.com/photo.jpg",
        }),
      });

      const result = await caller.socialLogin.googleCallback({
        token: "valid_google_id_token",
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBeGreaterThan(0);
      expect(result.message).toContain("successfully");
      const [tokenInfoUrl, tokenInfoOptions] = vi.mocked(global.fetch).mock.calls[0];
      expect(String(tokenInfoUrl)).toBe(
        "https://oauth2.googleapis.com/tokeninfo?id_token=valid_google_id_token"
      );
      expect(tokenInfoOptions).toEqual({ method: "GET" });

      const db = await getDb();
      expect(db).toBeTruthy();
      const [savedUser] = await db!
        .select()
        .from(users)
        .where(eq(users.email, "testuser-oauth-secret@gmail.com"))
        .limit(1);
      expect(savedUser?.profileImageUrl).toBe("https://example.com/photo.jpg");
    });

    it("should reject expired Google token", async () => {
      const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;

      // Mock fetch to simulate expired token
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          aud: googleClientId,
          sub: "google_expired_user",
          email: "expired@gmail.com",
          email_verified: true,
          exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
          name: "Expired User",
        }),
      });

      await expect(
        caller.socialLogin.googleCallback({
          token: "expired_google_id_token",
        })
      ).rejects.toThrow();
    });

    it("should reject unverified email from Google", async () => {
      const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID;

      // Mock fetch to simulate unverified email
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          aud: googleClientId,
          sub: "google_unverified_user",
          email: "unverified@gmail.com",
          email_verified: false, // Email not verified
          exp: Math.floor(Date.now() / 1000) + 3600,
          name: "Unverified User",
        }),
      });

      await expect(
        caller.socialLogin.googleCallback({
          token: "unverified_email_token",
        })
      ).rejects.toThrow();
    });
  });

  describe("Apple OAuth - Secret Validation", () => {
    it("should validate Apple credentials are configured or empty", () => {
      const appleServiceId = process.env.VITE_APPLE_SERVICE_ID;
      const appleTeamId = process.env.VITE_APPLE_TEAM_ID;
      const appleKeyId = process.env.VITE_APPLE_KEY_ID;

      // Apple credentials are optional - they can be configured later
      // Just verify they're strings if set
      if (appleServiceId) expect(typeof appleServiceId).toBe("string");
      if (appleTeamId) expect(typeof appleTeamId).toBe("string");
      if (appleKeyId) expect(typeof appleKeyId).toBe("string");
    });

    it("should reject invalid Apple token format", async () => {
      await expect(
        caller.socialLogin.appleCallback({
          token: "not_a_valid_jwt",
        })
      ).rejects.toThrow();
    });

    it("should reject malformed JWT", async () => {
      // JWT with wrong number of parts
      await expect(
        caller.socialLogin.appleCallback({
          token: "header.payload", // Missing signature
        })
      ).rejects.toThrow();
    });
  });

  describe("Email Availability Check", () => {
    it("should check if email is available", async () => {
      const result = await caller.socialLogin.checkEmailAvailability({
        email: `unique-${Date.now()}@example.com`,
      });

      expect(result).toHaveProperty("available");
      expect(typeof result.available).toBe("boolean");
      expect(result.available).toBe(true);
    });

    it("should detect unavailable email after signup", async () => {
      const testEmail = `signup-test-${Date.now()}@example.com`;

      // First, sign up with email/password
      await caller.auth.signup({
        email: testEmail,
        name: "Test User",
        password: "SecurePassword123!",
      });

      // Now check availability - should be unavailable
      const result = await caller.socialLogin.checkEmailAvailability({
        email: testEmail,
      });

      expect(result).toHaveProperty("available");
      expect(result.available).toBe(false);
    });
  });
});
