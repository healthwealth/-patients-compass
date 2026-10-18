import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  sendWelcomeEmail1,
  sendWelcomeEmail2,
  sendWelcomeEmail3,
} from "./_core/welcomeEmailSequence";
import { sendEmail } from "./_core/email";

// Mock the email service
vi.mock("./_core/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

describe("Email Sequence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendWelcomeEmail1", () => {
    it("should send email 1 with welcome and books content", async () => {
      const context = {
        userName: "John Doe",
        userEmail: "john@example.com",
        userId: 1,
      };

      const result = await sendWelcomeEmail1(context);

      expect(result).toBe(true);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "john@example.com",
          subject: expect.stringContaining("Welcome"),
          html: expect.stringContaining("Popular Books"),
        }),
      );
    });

    it("should include book links in email 1", async () => {
      const context = {
        userName: "Jane Smith",
        userEmail: "jane@example.com",
        userId: 2,
      };

      await sendWelcomeEmail1(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("/books");
      expect(call.html).toContain("Symptom Quiz");
      expect(call.html).toContain("AI Lab Scanner");
    });
  });

  describe("sendWelcomeEmail2", () => {
    it("should send email 2 with biomarker content", async () => {
      const context = {
        userName: "Alice Johnson",
        userEmail: "alice@example.com",
        userId: 3,
      };

      const result = await sendWelcomeEmail2(context);

      expect(result).toBe(true);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "alice@example.com",
          subject: expect.stringContaining("Biomarker"),
          html: expect.stringContaining("glucose"),
        }),
      );
    });

    it("should include biomarker guides in email 2", async () => {
      const context = {
        userName: "Bob Wilson",
        userEmail: "bob@example.com",
        userId: 4,
      };

      await sendWelcomeEmail2(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("Glucose");
      expect(call.html).toContain("Lipid");
      expect(call.html).toContain("Inflammation");
    });
  });

  describe("sendWelcomeEmail3", () => {
    it("should send email 3 with AI assistant content", async () => {
      const context = {
        userName: "Carol Davis",
        userEmail: "carol@example.com",
        userId: 5,
      };

      const result = await sendWelcomeEmail3(context);

      expect(result).toBe(true);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "carol@example.com",
          subject: expect.stringContaining("AI"),
          html: expect.stringContaining("Assistant"),
        }),
      );
    });

    it("should include AI assistant features in email 3", async () => {
      const context = {
        userName: "David Lee",
        userEmail: "david@example.com",
        userId: 6,
      };

      await sendWelcomeEmail3(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("Ask Health Questions");
      expect(call.html).toContain("Analyze Your Lab Results");
      expect(call.html).toContain("Personalized Recommendations");
    });
  });

  describe("Email Templates", () => {
    it("email 1 should have proper HTML structure", async () => {
      const context = {
        userName: "Test User",
        userEmail: "test@example.com",
        userId: 7,
      };

      await sendWelcomeEmail1(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("<!DOCTYPE html>");
      expect(call.html).toContain("</html>");
      expect(call.html).toContain("<style>");
    });

    it("email 2 should have proper HTML structure", async () => {
      const context = {
        userName: "Test User",
        userEmail: "test@example.com",
        userId: 8,
      };

      await sendWelcomeEmail2(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("<!DOCTYPE html>");
      expect(call.html).toContain("</html>");
    });

    it("email 3 should have proper HTML structure", async () => {
      const context = {
        userName: "Test User",
        userEmail: "test@example.com",
        userId: 9,
      };

      await sendWelcomeEmail3(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("<!DOCTYPE html>");
      expect(call.html).toContain("</html>");
    });

    it("all emails should include footer with privacy policy link", async () => {
      const context = {
        userName: "Test User",
        userEmail: "test@example.com",
        userId: 10,
      };

      await sendWelcomeEmail1(context);
      let call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("Privacy Policy");

      vi.clearAllMocks();

      await sendWelcomeEmail2(context);
      call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("Privacy Policy");

      vi.clearAllMocks();

      await sendWelcomeEmail3(context);
      call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("Privacy Policy");
    });

    it("all emails should use thepatientscompass.com domain", async () => {
      const context = {
        userName: "Test User",
        userEmail: "test@example.com",
        userId: 11,
      };

      await sendWelcomeEmail1(context);
      let call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("thepatientscompass.com");

      vi.clearAllMocks();

      await sendWelcomeEmail2(context);
      call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("thepatientscompass.com");

      vi.clearAllMocks();

      await sendWelcomeEmail3(context);
      call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("thepatientscompass.com");
    });
  });

  describe("Email Personalization", () => {
    it("should use user name in email 1", async () => {
      const context = {
        userName: "Custom Name",
        userEmail: "custom@example.com",
        userId: 12,
      };

      await sendWelcomeEmail1(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("Custom Name");
    });

    it("should use user name in email 2", async () => {
      const context = {
        userName: "Another Name",
        userEmail: "another@example.com",
        userId: 13,
      };

      await sendWelcomeEmail2(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("Another Name");
    });

    it("should use user name in email 3", async () => {
      const context = {
        userName: "Third Name",
        userEmail: "third@example.com",
        userId: 14,
      };

      await sendWelcomeEmail3(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("Third Name");
    });

    it("should use fallback name when user name is empty", async () => {
      const context = {
        userName: "",
        userEmail: "nofallback@example.com",
        userId: 15,
      };

      await sendWelcomeEmail1(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.html).toContain("Hi there");
    });
  });

  describe("Email Subjects", () => {
    it("email 1 should have engaging subject", async () => {
      const context = {
        userName: "Test",
        userEmail: "test@example.com",
        userId: 16,
      };

      await sendWelcomeEmail1(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.subject).toBe("Welcome to The Patient's Compass 🎯");
    });

    it("email 2 should have engaging subject", async () => {
      const context = {
        userName: "Test",
        userEmail: "test@example.com",
        userId: 17,
      };

      await sendWelcomeEmail2(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.subject).toBe("Understanding Your Biomarkers 📊");
    });

    it("email 3 should have engaging subject", async () => {
      const context = {
        userName: "Test",
        userEmail: "test@example.com",
        userId: 18,
      };

      await sendWelcomeEmail3(context);

      const call = (sendEmail as any).mock.calls[0][0];
      expect(call.subject).toBe("Your AI Health Assistant is Ready 🤖");
    });
  });
});
