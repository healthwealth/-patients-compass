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
import * as schema from "../../drizzle/schema";
import { getTableColumns, getTableName, is } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { sdk } from "../_core/sdk";
import { importMissingLegacyAssets } from "../_core/storageProxy";
import legacyAssetManifest from "../legacyAssetManifest.json";

/**
 * One-time Manus → Cloudflare migration helpers (admin only).
 *
 * POST /api/admin/migration/import-data
 *   Imports rows exported from the Manus (MySQL) database. Body:
 *   { "tables": { "users": [ {...row}, ... ], "blog_posts": [...] } }
 *   Values are converted to the D1 column types (dates, JSON, booleans) and
 *   existing rows (same id / unique key) are left untouched, so re-running it is safe.
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

// ─── Data import ─────────────────────────────────────────────────────────────

const TABLES: Record<string, SQLiteTable> = Object.fromEntries(
  (Object.values(schema) as unknown[])
    .filter(value => is(value, SQLiteTable))
    .map(value => [getTableName(value as SQLiteTable), value as SQLiteTable])
);

/** Parses MySQL-style date values ("2026-07-01 12:34:56", ISO strings, epoch numbers). */
function toDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value < 1e12 ? value * 1000 : value);
  const text = String(value).trim();
  if (/^\d+$/.test(text)) {
    const n = Number(text);
    return new Date(n < 1e12 ? n * 1000 : n);
  }
  // MySQL DATETIME/TIMESTAMP text has no zone; Manus stored UTC.
  const iso = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(text) ? `${text.replace(" ", "T")}Z` : text;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function convertValue(column: any, value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const type = String(column.columnType ?? "");
  if (type === "SQLiteTimestamp") return toDate(value);
  if (type === "SQLiteTextJson") {
    if (typeof value !== "string") return value;
    try {
      let parsed: unknown = JSON.parse(value);
      // Some MySQL exports double-encode JSON columns.
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch { /* keep string */ }
      }
      return parsed;
    } catch {
      return value;
    }
  }
  if (type === "SQLiteInteger") {
    if (typeof value === "boolean") return value ? 1 : 0;
    if (value === "true") return 1;
    if (value === "false") return 0;
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : value;
  }
  if (type === "SQLiteReal") {
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }
  return typeof value === "string" ? value : typeof value === "object" ? JSON.stringify(value) : String(value);
}

const USER_REFERENCE_COLUMNS = new Set(["userId", "referrerId", "referredUserId", "createdBy", "updatedBy"]);

/**
 * Imports one table. `userIdMap` carries old Manus user ids that were matched
 * (by email) to an account already created on the new site, so that member's
 * related rows land on the right account instead of colliding.
 */
export async function importTableRows(
  tableName: string,
  rows: Array<Record<string, unknown>>,
  userIdMap: Map<number, number> = new Map()
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const table = TABLES[tableName];
  if (!table) return { table: tableName, skipped: true, reason: "not part of this site's database", inserted: 0, errors: [] as string[] };
  const columns = getTableColumns(table) as Record<string, any>;
  const byDbName = new Map(Object.entries(columns).map(([key, column]) => [column.name as string, key]));

  let matched = 0;
  if (tableName === "users") {
    const existing = await db.select({ id: users.id, email: users.email }).from(users);
    const byEmail = new Map(existing.filter(u => u.email).map(u => [u.email!.trim().toLowerCase(), u.id]));
    rows = rows.filter(row => {
      const email = typeof row.email === "string" ? row.email.trim().toLowerCase() : "";
      const oldId = Number(row.id);
      const currentId = email ? byEmail.get(email) : undefined;
      if (currentId !== undefined && currentId !== oldId) {
        if (Number.isFinite(oldId)) userIdMap.set(oldId, currentId);
        matched++;
        return false; // keep the account that already exists on the new site
      }
      return true;
    });
  }

  const prepared = rows.map(row => {
    const out: Record<string, unknown> = {};
    for (const [field, raw] of Object.entries(row)) {
      const key = byDbName.get(field) ?? (field in columns ? field : null);
      if (!key) continue;
      let converted = convertValue(columns[key], raw);
      if (USER_REFERENCE_COLUMNS.has(key) && typeof converted === "number" && userIdMap.has(converted)) {
        converted = userIdMap.get(converted);
      }
      if (converted !== undefined) out[key] = converted;
    }
    return out;
  });
  // D1 allows at most 100 bound parameters per statement.
  const columnCount = Math.max(1, Object.keys(columns).length);
  const chunkSize = Math.max(1, Math.floor(100 / columnCount));
  let inserted = 0;
  const errors: string[] = [];
  for (let i = 0; i < prepared.length; i += chunkSize) {
    const chunk = prepared.slice(i, i + chunkSize);
    try {
      const result: any = await db.insert(table).values(chunk as any).onConflictDoNothing();
      inserted += Number(result?.meta?.changes ?? chunk.length);
    } catch {
      // Fall back to row-by-row so one bad row does not block the rest.
      for (const row of chunk) {
        try {
          const result: any = await db.insert(table).values(row as any).onConflictDoNothing();
          inserted += Number(result?.meta?.changes ?? 1);
        } catch (error) {
          errors.push(`${tableName} id=${String((row as any).id ?? "?")}: ${error instanceof Error ? (error.cause as Error | undefined)?.message ?? error.message : String(error)}`.slice(0, 300));
        }
      }
    }
  }
  return {
    table: tableName,
    skipped: false,
    received: rows.length + matched,
    inserted,
    ...(matched ? { matchedExisting: matched } : {}),
    errors: errors.slice(0, 20),
  };
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
  app.post("/api/admin/migration/import-data", async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const tables = (req.body?.tables ?? req.body) as Record<string, unknown>;
    if (!tables || typeof tables !== "object") {
      res.status(400).json({ ok: false, error: "Expected { tables: { tableName: [rows] } }" });
      return;
    }
    // Parents first so related rows line up; everything else afterwards.
    const order = ["users", "blog_posts", "article_collections", "telehealth_partners"];
    const names = Object.keys(tables).sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
    });
    const results = [];
    const userIdMap = new Map<number, number>();
    for (const name of names) {
      const rows = tables[name];
      if (!Array.isArray(rows)) {
        results.push({ table: name, skipped: true, reason: "not a list of rows", inserted: 0, errors: [] });
        continue;
      }
      try {
        results.push(await importTableRows(name, rows as Array<Record<string, unknown>>, userIdMap));
      } catch (error) {
        results.push({ table: name, skipped: true, reason: error instanceof Error ? error.message : String(error), inserted: 0, errors: [] });
      }
    }
    res.json({ ok: true, results });
  });

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
