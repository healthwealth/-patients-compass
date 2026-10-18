import type { Express, Request, Response } from "express";
import { getDb } from "../db";
import {
  articleCollections,
  assistantPortraitAssets,
  blogPosts,
  collectionCoverAssets,
  labReports,
  savedCertificates,
  telehealthPartners,
  users,
} from "../../drizzle/schema";
import { sdk } from "../_core/sdk";
import { importMissingLegacyAssets } from "../_core/storageProxy";
import legacyAssetManifest from "../legacyAssetManifest.json";

/**
 * One-time Manus → Cloudflare migration helpers (admin only).
 *
 * POST /api/admin/migration/import-files
 *   Copies every file the site references (code + database) from the old Manus
 *   site into R2. Safe to run repeatedly; already-copied files are skipped.
 *   The hourly cron also runs this automatically until nothing is left.
 */

const STORAGE_REF = /\/manus-storage\/([A-Za-z0-9._%\/-]+)/g;

function keysFromText(value: unknown, into: Set<string>) {
  if (typeof value !== "string" || !value.includes("/manus-storage/")) return;
  for (const match of value.matchAll(STORAGE_REF)) {
    let key = match[1].replace(/[.,)]+$/, "");
    try {
      key = decodeURIComponent(key);
    } catch {
      // keep raw
    }
    if (key) into.add(key);
  }
}

export async function collectStorageKeys(): Promise<string[]> {
  const keys = new Set<string>(legacyAssetManifest as string[]);
  const db = await getDb();
  if (!db) return Array.from(keys);
  const sources: Array<Promise<Array<Record<string, unknown>>>> = [
    db.select({ a: users.profileImageUrl }).from(users),
    db.select({ a: blogPosts.featuredImage, b: blogPosts.content }).from(blogPosts),
    db.select({ a: articleCollections.coverImage }).from(articleCollections),
    db.select({ a: collectionCoverAssets.imageUrl }).from(collectionCoverAssets),
    db.select({ a: assistantPortraitAssets.imageUrl }).from(assistantPortraitAssets),
    db.select({ a: savedCertificates.fileUrl, b: savedCertificates.previewUrl }).from(savedCertificates),
    db.select({ a: labReports.fileUrl }).from(labReports),
    db.select({ a: telehealthPartners.logoUrl }).from(telehealthPartners),
  ];
  for (const rows of await Promise.allSettled(sources)) {
    if (rows.status !== "fulfilled") continue;
    for (const row of rows.value) for (const value of Object.values(row)) keysFromText(value, keys);
  }
  return Array.from(keys);
}

export async function runLegacyFileImport(timeBudgetMs: number) {
  const keys = await collectStorageKeys();
  return importMissingLegacyAssets(keys, { timeBudgetMs });
}

async function requireAdmin(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (user.isCron || user.role === "admin") return true;
  } catch {
    // fall through
  }
  res.status(403).json({ error: "Admin sign-in required" });
  return false;
}

export function registerMigrationRoutes(app: Express) {
  app.post("/api/admin/migration/import-files", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    try {
      const result = await runLegacyFileImport(25_000);
      res.json({ ok: true, ...result, done: result.remaining === 0 && result.failed.length === 0 });
    } catch (error) {
      res.status(500).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  });
}
