import { Express } from "express";
import { devSignIn, devCreateTestUser } from "./devSignIn";

/**
 * Register development sign-in routes for testing when OAuth is unavailable.
 * Only available in development mode.
 */
export function registerDevSignInRoutes(app: Express) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  // POST /api/dev/sign-in - Create test user and set session cookie
  app.post("/api/dev/sign-in", devSignIn);

  // POST /api/dev/create-test-user - Create test user without session
  app.post("/api/dev/create-test-user", devCreateTestUser);

  console.log("[Dev Sign-In] Development sign-in routes registered (development mode only)");
}
