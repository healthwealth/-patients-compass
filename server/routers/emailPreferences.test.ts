import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user") {
  const userId = 1_000_000_000 + Math.floor(Math.random() * 1_000_000);
  const user: AuthenticatedUser = {
    id: userId,
    openId: `${role}-email-preferences-${userId}`,
    email: role === "admin" ? "admin@example.com" : "user@example.com",
    name: role === "admin" ? "Admin User" : "Sample User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("emailPreferences router", () => {
  describe("getPreferences", () => {
    it("should return default preferences for new users", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.emailPreferences.getPreferences();

      expect(result).toEqual({
        marketing: true,
        transactional: true,
        digests: true,
        frequency: "weekly",
      });
    });
  });

  describe("updatePreferences", () => {
    it("should update user preferences", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.emailPreferences.updatePreferences({
        marketing: false,
        frequency: "daily",
      });

      expect(result.success).toBe(true);
      expect(result.preferences.marketing).toBe(false);
      expect(result.preferences.frequency).toBe("daily");
      expect(result.preferences.transactional).toBe(true);
    });

    it("should partially update preferences", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // First update
      await caller.emailPreferences.updatePreferences({
        marketing: false,
      });

      // Second update - should preserve previous values
      const result = await caller.emailPreferences.updatePreferences({
        digests: false,
      });

      expect(result.preferences.marketing).toBe(false);
      expect(result.preferences.digests).toBe(false);
      expect(result.preferences.transactional).toBe(true);
    });
  });

  describe("getCampaignMetrics", () => {
    it("should reject non-admin users", async () => {
      const ctx = createAuthContext("user");
      const caller = appRouter.createCaller(ctx);

      await expect(caller.emailPreferences.getCampaignMetrics()).rejects.toThrow();
    });

    it("should return campaign metrics for admin users", async () => {
      const ctx = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.emailPreferences.getCampaignMetrics();

      expect(result).toBeDefined();
      expect(result.campaigns).toBeDefined();
      expect(result.campaigns.trialExpiration).toBeDefined();
      expect(result.campaigns.onboarding).toBeDefined();
      expect(result.campaigns.reEngagement).toBeDefined();
      expect(result.campaigns.weeklyDigest).toBeDefined();
      expect(result.totalUsers).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it("should have correct metric structure", async () => {
      const ctx = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.emailPreferences.getCampaignMetrics();

      // Check structure of each campaign metric
      for (const [key, campaign] of Object.entries(result.campaigns)) {
        if (key === "onboarding") {
          expect(campaign.email1).toHaveProperty("sent");
          expect(campaign.email1).toHaveProperty("opened");
          expect(campaign.email1).toHaveProperty("openRate");
          expect(campaign.average).toHaveProperty("sent");
          expect(campaign.average).toHaveProperty("openRate");
        } else {
          expect(campaign).toHaveProperty("sent");
          expect(campaign).toHaveProperty("opened");
          expect(campaign).toHaveProperty("openRate");
        }
      }
    });
  });

  describe("getCampaignStats", () => {
    it("should reject non-admin users", async () => {
      const ctx = createAuthContext("user");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.emailPreferences.getCampaignStats({
          campaign: "trialExpiration",
        })
      ).rejects.toThrow();
    });

    it("should return stats for each campaign type", async () => {
      const ctx = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);

      const campaigns = ["trialExpiration", "onboarding", "reEngagement", "weeklyDigest"] as const;

      for (const campaign of campaigns) {
        const result = await caller.emailPreferences.getCampaignStats({
          campaign,
        });

        expect(result.campaign).toBe(campaign);
        expect(result).toHaveProperty("totalSent");
        expect(result).toHaveProperty("totalOpened");
        expect(result).toHaveProperty("overallOpenRate");
        expect(result).toHaveProperty("trend");
        expect(result).toHaveProperty("timestamp");
      }
    });

    it("should have valid trend data structure", async () => {
      const ctx = createAuthContext("admin");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.emailPreferences.getCampaignStats({
        campaign: "trialExpiration",
      });

      if (result.trend && result.trend.length > 0) {
        for (const trend of result.trend) {
          expect(trend).toHaveProperty("date");
          expect(trend).toHaveProperty("sent");
          expect(trend).toHaveProperty("opened");
          expect(trend).toHaveProperty("openRate");
        }
      }
    });
  });
});
