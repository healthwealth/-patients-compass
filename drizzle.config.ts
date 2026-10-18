import { defineConfig } from "drizzle-kit";

// Generates SQL migrations for Cloudflare D1 (SQLite).
// Apply them with: npx wrangler d1 migrations apply patients-compass-db --remote
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
});
