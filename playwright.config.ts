import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:8787",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    // Builds the site and runs it in the local Cloudflare runtime (D1/R2 simulated).
    command: "pnpm build && npx wrangler d1 migrations apply DB --local && npx wrangler dev --port 8787 --ip 127.0.0.1",
    url: "http://127.0.0.1:8787",
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
