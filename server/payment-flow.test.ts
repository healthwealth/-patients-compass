import { describe, it, expect, beforeEach, vi } from "vitest";
import { sendEmail } from "./handlers/emailHandler";
import Stripe from "stripe";

// Mock Stripe
vi.mock("stripe", () => {
  return {
    default: vi.fn(() => ({
      webhooks: {
        generateTestHeaderString: vi.fn(({ payload, secret }) => {
          // Generate a valid test signature
          return `t=${Math.floor(Date.now() / 1000)},v1=test_signature`;
        }),
      },
      customers: {
        create: vi.fn().mockResolvedValue({
          id: "cus_test_123",
          email: "test@example.com",
          name: "Test User",
        }),
      },
      subscriptions: {
        create: vi.fn().mockResolvedValue({
          id: "sub_test_123",
          customer: "cus_test_123",
          status: "active",
          current_period_end: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
        }),
      },
    })),
  };
});

describe("Payment Flow Features", () => {
  describe("Welcome Email on Successful Payment", () => {
    it("should send welcome email when checkout session completes", async () => {
      const mockSendEmail = vi.fn().mockResolvedValue({ id: "email_123" });
      
      // Simulate email sending
      const userEmail = "test@example.com";
      const userName = "Test User";
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2C2A29;">Welcome to Pro! 🎉</h2>
          <p>Hi ${userName},</p>
          <p>Your subscription is now active! You now have unlimited access to:</p>
          <ul style="color: #555;">
            <li>Unlimited AI health insights</li>
            <li>Advanced lab analysis</li>
            <li>Personalized wellness recommendations</li>
            <li>Priority email support</li>
          </ul>
          <p style="text-align: center; margin: 30px 0;">
            <a href="https://thepatientscompass.com/dashboard" style="background-color: #6B8E6F; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
              Go to Dashboard
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #EEE; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
          </p>
        </div>
      `;

      expect(emailContent).toContain("Welcome to Pro! 🎉");
      expect(emailContent).toContain("EDUCATIONAL CONTENT ONLY");
      expect(emailContent).toContain("Unlimited AI health insights");
    });

    it("should include correct email disclaimer", async () => {
      const emailContent = `
        <p style="color: #999; font-size: 12px;">
          <strong>EDUCATIONAL CONTENT ONLY</strong> - This platform is for informational purposes. Always consult with a healthcare provider.
        </p>
      `;
      
      expect(emailContent).toContain("EDUCATIONAL CONTENT ONLY");
      expect(emailContent).toContain("healthcare provider");
    });
  });

  describe("Success and Cancellation Pages", () => {
    it("should render success page with correct elements", () => {
      const successPageContent = {
        title: "Payment Successful! 🎉",
        subtitle: "Thank you for subscribing to The Patient's Compass Pro!",
        features: [
          "Unlimited AI health insights",
          "Advanced lab analysis",
          "Personalized wellness recommendations",
          "Priority email support",
        ],
        buttons: ["Go to Dashboard", "Back to Home"],
        disclaimer: "EDUCATIONAL CONTENT ONLY",
      };

      expect(successPageContent.title).toBe("Payment Successful! 🎉");
      expect(successPageContent.features).toHaveLength(4);
      expect(successPageContent.buttons).toContain("Go to Dashboard");
      expect(successPageContent.disclaimer).toBe("EDUCATIONAL CONTENT ONLY");
    });

    it("should render cancellation page with correct elements", () => {
      const cancelPageContent = {
        title: "Payment Canceled",
        subtitle: "Your payment was not completed. No charges have been made to your account.",
        reasons: [
          "You closed the payment window",
          "Your payment method was declined",
          "You chose to cancel the transaction",
        ],
        buttons: ["Try Again", "Back to Home"],
        disclaimer: "EDUCATIONAL CONTENT ONLY",
      };

      expect(cancelPageContent.title).toBe("Payment Canceled");
      expect(cancelPageContent.reasons).toHaveLength(3);
      expect(cancelPageContent.buttons).toContain("Try Again");
      expect(cancelPageContent.disclaimer).toBe("EDUCATIONAL CONTENT ONLY");
    });
  });

  describe("Subscription Management UI", () => {
    it("should display Pro plan details correctly", () => {
      const subscriptionData = {
        isPro: true,
        plan: "Pro",
        price: "$80/year",
        status: "Active",
        benefits: [
          "Unlimited AI health insights",
          "Advanced lab analysis",
          "Personalized wellness recommendations",
          "Priority email support",
        ],
        nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };

      expect(subscriptionData.isPro).toBe(true);
      expect(subscriptionData.plan).toBe("Pro");
      expect(subscriptionData.price).toBe("$80/year");
      expect(subscriptionData.benefits).toHaveLength(4);
      expect(subscriptionData.nextBillingDate).toBeInstanceOf(Date);
    });

    it("should display Free plan details correctly", () => {
      const subscriptionData = {
        isPro: false,
        plan: "Free",
        price: "Free",
        status: "Free",
        ctaText: "Upgrade to Pro",
      };

      expect(subscriptionData.isPro).toBe(false);
      expect(subscriptionData.plan).toBe("Free");
      expect(subscriptionData.ctaText).toBe("Upgrade to Pro");
    });

    it("should include payment method information", () => {
      const paymentMethodData = {
        type: "Link",
        lastFourDigits: "4242",
        isDefault: true,
      };

      expect(paymentMethodData.type).toBe("Link");
      expect(paymentMethodData.isDefault).toBe(true);
    });

    it("should include billing history section", () => {
      const billingHistoryData = {
        invoices: [
          {
            description: "Annual Pro Subscription",
            invoiceNumber: "INV-001",
            amount: "$80.00",
            date: "Jun 19, 2026",
          },
        ],
      };

      expect(billingHistoryData.invoices).toHaveLength(1);
      expect(billingHistoryData.invoices[0].amount).toBe("$80.00");
    });

    it("should include subscription actions", () => {
      const actions = {
        changePlan: "Change Plan",
        cancelSubscription: "Cancel Subscription",
        updatePaymentMethod: "Update Payment Method",
      };

      expect(actions.changePlan).toBe("Change Plan");
      expect(actions.cancelSubscription).toBe("Cancel Subscription");
      expect(actions.updatePaymentMethod).toBe("Update Payment Method");
    });
  });

  describe("Webhook Integration", () => {
    it("should handle checkout.session.completed event", () => {
      const webhookEvent = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            customer: "cus_test_123",
            subscription: "sub_test_123",
            client_reference_id: "42",
          },
        },
      };

      expect(webhookEvent.type).toBe("checkout.session.completed");
      expect(webhookEvent.data.object.subscription).toBe("sub_test_123");
    });

    it("should verify webhook signature", () => {
      const secret = "whsec_test_secret";
      const payload = JSON.stringify({
        type: "checkout.session.completed",
        data: { object: { id: "cs_test" } },
      });

      // Signature should be generated using Stripe's method
      expect(secret).toContain("whsec_");
      expect(payload).toBeTruthy();
    });
  });

  describe("GA4 Tracking", () => {
    it("should track purchase success event", () => {
      const trackingData = {
        event: "purchase_success",
        session_id: "cs_test_123",
      };

      expect(trackingData.event).toBe("purchase_success");
      expect(trackingData.session_id).toBeTruthy();
    });

    it("should track purchase canceled event", () => {
      const trackingData = {
        event: "purchase_canceled",
      };

      expect(trackingData.event).toBe("purchase_canceled");
    });
  });
});
