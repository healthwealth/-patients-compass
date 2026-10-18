import { describe, it, expect, vi, beforeEach } from "vitest";
import { devSignIn, devCreateTestUser } from "./devSignIn";
import { Request, Response } from "express";

// Mock dependencies
vi.mock("./cookies", () => ({
  getSessionCookieOptions: () => ({
    secure: true,
    sameSite: "none",
    httpOnly: true,
    path: "/",
  }),
}));

vi.mock("./sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-token-123"),
  },
}));

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([
            {
              id: 1,
              openId: "dev-test-user@example.com",
              email: "user@example.com",
              name: "Test User",
              role: "user",
              createdAt: new Date(),
              updatedAt: new Date(),
              lastSignedIn: new Date(),
              loginMethod: "dev-bypass",
            },
          ]),
        }),
      }),
    }),
  }),
  upsertUser: vi.fn().mockResolvedValue(undefined),
}));

describe("Dev Sign-In", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      protocol: "https",
      headers: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
    };
  });

  describe("devSignIn", () => {
    it("should reject in production mode", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      await devSignIn(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Development sign-in not available in production",
      });

      process.env.NODE_ENV = originalEnv;
    });

    it("should reject missing email or name", async () => {
      process.env.NODE_ENV = "development";

      mockReq.body = { email: "test@example.com" }; // missing name

      await devSignIn(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email and name are required",
      });
    });

    it("should create test user and set session cookie", async () => {
      process.env.NODE_ENV = "development";

      mockReq.body = {
        email: "user@example.com",
        name: "Test User",
      };

      await devSignIn(mockReq as Request, mockRes as Response);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        expect.any(String),
        "mock-token-123",
        expect.any(Object),
      );

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            email: "user@example.com",
            name: "Test User",
          }),
        }),
      );
    });
  });

  describe("devCreateTestUser", () => {
    it("should reject in production mode", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      await devCreateTestUser(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Development endpoint not available in production",
      });

      process.env.NODE_ENV = originalEnv;
    });

    it("should create test user without session", async () => {
      process.env.NODE_ENV = "development";

      mockReq.body = {
        email: "user@example.com",
        name: "Test User",
      };

      await devCreateTestUser(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            email: "user@example.com",
            name: "Test User",
          }),
        }),
      );

      // Should NOT set cookie
      expect(mockRes.cookie).not.toHaveBeenCalled();
    });
  });
});
