import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerAdminBypassRoute } from "./adminBypass";
import { registerDevSignInRoutes } from "./devSignInRoutes";
import { unsubscribeRouter } from "../handlers/unsubscribeHandler";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook } from "../handlers/stripeWebhookHandler";
import { handleShopifyWebhook } from "../handlers/shopifyWebhookHandler";
import { sitemapHandler } from "../handlers/sitemapHandler";
import {
  handleScheduledEmail1,
  handleScheduledEmail2,
  handleScheduledEmail3,
} from "./emailScheduledHandlers";
import {
  handleTrialExpirationReminder,
  handleOnboardingSequence,
  handleDailyAnalyticsSnapshot,
} from "../handlers/emailScheduledHandlers";
import {
  handleReEngagementCampaign,
  handleWeeklyDigest,
} from "../handlers/emailReEngagementHandlers";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Google Identity Services uses FedCM. Keep the identity credential request enabled
  // for this first-party document without delegating it to third-party origins.
  app.use((_req, res, next) => {
    res.setHeader("Permissions-Policy", "identity-credentials-get=(self)");
    next();
  });
  // Stripe webhook MUST use raw body — register BEFORE json middleware
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
  // Shopify webhook HMAC verification also requires the exact raw body.
  app.post("/api/shopify/webhook", express.raw({ type: "application/json" }), handleShopifyWebhook);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerAdminBypassRoute(app);
  registerDevSignInRoutes(app);
  // Unsubscribe handlers
  app.use("/api/unsubscribe", unsubscribeRouter);
  // Scheduled email handlers (legacy onboarding sequence)
  app.post("/api/scheduled/email-1", handleScheduledEmail1);
  app.post("/api/scheduled/email-2", handleScheduledEmail2);
  app.post("/api/scheduled/email-3", handleScheduledEmail3);
  // New growth automation handlers
  app.post("/api/scheduled/trial-expiration", handleTrialExpirationReminder);
  app.post("/api/scheduled/onboarding", handleOnboardingSequence);
  app.post("/api/scheduled/analytics-snapshot", handleDailyAnalyticsSnapshot);
  // Re-engagement and digest handlers
  app.post("/api/scheduled/re-engagement", handleReEngagementCampaign);
  app.post("/api/scheduled/weekly-digest", handleWeeklyDigest);
  // Generate fresh blog article URLs for search crawlers before static-file handling.
  app.get("/sitemap.xml", sitemapHandler);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
