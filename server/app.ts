import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAdminBypassRoute } from "./_core/adminBypass";
import { registerDevSignInRoutes } from "./_core/devSignInRoutes";
import { unsubscribeRouter } from "./handlers/unsubscribeHandler";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";
import { handleStripeWebhook } from "./handlers/stripeWebhookHandler";
import { handleShopifyWebhook } from "./handlers/shopifyWebhookHandler";
import { sitemapHandler } from "./handlers/sitemapHandler";
import { handleScheduledEmail1, handleScheduledEmail2, handleScheduledEmail3 } from "./_core/emailScheduledHandlers";
import {
  handleTrialExpirationReminder,
  handleOnboardingSequence,
  handleDailyAnalyticsSnapshot,
} from "./handlers/emailScheduledHandlers";
import { handleReEngagementCampaign, handleWeeklyDigest } from "./handlers/emailReEngagementHandlers";
import { registerMigrationRoutes } from "./handlers/migrationHandler";
import { ENV } from "./_core/env";

/**
 * Builds the Express app that handles every dynamic route (API, webhooks,
 * scheduled jobs, sitemap). Static files and `/manus-storage/*` are served by
 * the Worker itself before requests reach Express.
 */
export function createApp() {
  const app = express();
  // Requests arrive from the Cloudflare edge; trust its forwarding headers.
  app.set("trust proxy", true);
  app.disable("x-powered-by");

  // Google Identity Services uses FedCM. Keep the identity credential request enabled
  // for this first-party document without delegating it to third-party origins.
  app.use((_req, res, next) => {
    res.setHeader("Permissions-Policy", "identity-credentials-get=(self)");
    next();
  });

  // Webhooks MUST use the raw body — register BEFORE json middleware.
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
  app.post("/api/shopify/webhook", express.raw({ type: "application/json" }), handleShopifyWebhook);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerAdminBypassRoute(app);
  registerDevSignInRoutes(app);
  registerMigrationRoutes(app);

  app.use("/api/unsubscribe", unsubscribeRouter);

  // Scheduled jobs (called by the Worker's Cron Trigger with CRON_SECRET)
  app.post("/api/scheduled/email-1", handleScheduledEmail1);
  app.post("/api/scheduled/email-2", handleScheduledEmail2);
  app.post("/api/scheduled/email-3", handleScheduledEmail3);
  app.post("/api/scheduled/trial-expiration", handleTrialExpirationReminder);
  app.post("/api/scheduled/onboarding", handleOnboardingSequence);
  app.post("/api/scheduled/analytics-snapshot", handleDailyAnalyticsSnapshot);
  app.post("/api/scheduled/re-engagement", handleReEngagementCampaign);
  app.post("/api/scheduled/weekly-digest", handleWeeklyDigest);

  app.get("/sitemap.xml", sitemapHandler);

  // Public, non-secret settings for the browser (editable in the Cloudflare dashboard).
  app.get("/api/public-config.js", (_req, res) => {
    const config = {
      googleClientId: ENV.googleClientId,
      gtmContainerId: process.env.GTM_CONTAINER_ID || process.env.VITE_GTM_CONTAINER_ID || "",
      appleServiceId: ENV.appleServiceId,
      appleTeamId: ENV.appleTeamId,
      appleKeyId: ENV.appleKeyId,
      showMaintenanceBanner: (process.env.SHOW_MAINTENANCE_BANNER || process.env.VITE_SHOW_MAINTENANCE_BANNER) === "true",
    };
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(`window.__PC_CONFIG__=${JSON.stringify(config).replace(/</g, "\\u003c")};`);
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
