import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmail, sendWaitlistConfirmation, sendReEngagementEmail, sendBulkReEngagement } from "./email";

// Mock fetch
global.fetch = vi.fn();

describe("Email Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendEmail", () => {
    it("should send email with valid API key", async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "test-email-id" }),
      });

      const result = await sendEmail({
        to: "test@example.com",
        subject: "Test Email",
        html: "<p>Test</p>",
      });

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Bearer"),
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should return false when API key is missing", async () => {
      const originalKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;

      // The configuration wrapper captures env values at module evaluation.
      // Re-import the helper after clearing the test key to exercise this path.
      vi.resetModules();
      const { sendEmail: sendEmailWithoutApiKey } = await import("./email");

      const result = await sendEmailWithoutApiKey({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result).toBe(false);

      // Restore API key
      if (originalKey) process.env.RESEND_API_KEY = originalKey;
      vi.resetModules();
    });

    it("should handle API errors gracefully", async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Invalid email" }),
      });

      const result = await sendEmail({
        to: "invalid-email",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result).toBe(false);
    });
  });

  describe("sendWaitlistConfirmation", () => {
    it("should send waitlist confirmation email", async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "confirmation-id" }),
      });

      const result = await sendWaitlistConfirmation("user@example.com");

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          body: expect.stringContaining("Welcome to The Patient's Compass Waitlist"),
        })
      );
    });
  });

  describe("sendReEngagementEmail", () => {
    it("should send re-engagement email", async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "reeng-id" }),
      });

      const result = await sendReEngagementEmail("user@example.com");

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          body: expect.stringContaining("Sign-In is Back Online"),
        })
      );
    });
  });

  describe("sendBulkReEngagement", () => {
    it("should send bulk emails and track success/failure", async () => {
      const mockFetch = global.fetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: "bulk-id" }),
      });

      const emails = ["user1@example.com", "user2@example.com", "user3@example.com"];
      const result = await sendBulkReEngagement(emails);

      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should handle partial failures in bulk send", async () => {
      const mockFetch = global.fetch as any;
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "bulk-1" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "Invalid email" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "bulk-3" }),
        });

      const emails = ["user1@example.com", "invalid@", "user3@example.com"];
      const result = await sendBulkReEngagement(emails);

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
    });
  });
});
