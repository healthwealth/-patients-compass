import type { R2Bucket } from "@cloudflare/workers-types";
import { ENV } from "./env";
import { getBindings } from "./runtime";

/**
 * Serves stored files from Cloudflare R2 at `/manus-storage/{key}`.
 *
 * The URL prefix is unchanged from the Manus site so existing pages, emails and
 * database rows keep working. This runs directly in the Worker (not Express) so
 * large files such as the hero video stream straight from R2 with range support.
 *
 * Migration from Manus: when a file is not in R2 yet and LEGACY_ASSET_ORIGIN is
 * set (the old *.manus.space address), the file is fetched from the old site,
 * served, and saved into R2. The hourly cron job also copies every known file
 * ahead of time (see `importMissingLegacyAssets`).
 */

export const STORAGE_PATH_PREFIX = "/manus-storage/";

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
  ico: "image/x-icon",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  pdf: "application/pdf",
  json: "application/json",
  txt: "text/plain; charset=utf-8",
};

export function guessContentType(key: string) {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

export function isSafeStorageKey(key: string) {
  return !!key && !key.includes("..") && !key.startsWith("/") && !key.includes("\\") && key.length < 1024;
}

function getBucket(): R2Bucket | undefined {
  return getBindings().STORAGE as R2Bucket | undefined;
}

/** Header marking our own fetches to the old site, so a request can never loop back into itself. */
const LEGACY_FETCH_HEADER = "x-pc-legacy-fetch";

function legacyOrigins() {
  return ENV.legacyAssetOrigin
    .split(",")
    .map(origin => origin.trim().replace(/\/+$/, ""))
    .filter(origin => /^https?:\/\//.test(origin));
}

/** Copies one file from the legacy Manus site into R2 (tries each LEGACY_ASSET_ORIGIN in order). */
export async function importLegacyAsset(
  key: string
): Promise<{ stored: boolean; status: number; contentType?: string; body?: ArrayBuffer }> {
  const bucket = getBucket();
  const origins = legacyOrigins();
  if (!bucket || !origins.length) return { stored: false, status: 404 };
  const path = key.split("/").map(encodeURIComponent).join("/");
  let lastStatus = 404;
  for (const origin of origins) {
    let upstream: Response;
    try {
      upstream = await fetch(`${origin}${STORAGE_PATH_PREFIX}${path}`, {
        redirect: "follow",
        headers: { [LEGACY_FETCH_HEADER]: "1" },
      });
    } catch {
      lastStatus = 502;
      continue;
    }
    if (!upstream.ok) {
      lastStatus = upstream.status;
      continue;
    }
    const contentTypeHeader = upstream.headers.get("content-type") ?? "";
    // A site's HTML page (e.g. an SPA fallback) is not the file we asked for.
    if (contentTypeHeader.startsWith("text/html")) {
      lastStatus = 404;
      continue;
    }
    const body = await upstream.arrayBuffer();
    const contentType =
      contentTypeHeader && !contentTypeHeader.startsWith("binary/") && !contentTypeHeader.startsWith("application/octet-stream")
        ? contentTypeHeader
        : guessContentType(key);
    await bucket.put(key, body, { httpMetadata: { contentType } });
    return { stored: true, status: 200, contentType, body };
  }
  return { stored: false, status: lastStatus };
}

/** Handles GET/HEAD `/manus-storage/*` requests in the Worker. */
export async function handleStorageRequest(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const url = new URL(request.url);
  let key = url.pathname.slice(STORAGE_PATH_PREFIX.length);
  try {
    key = decodeURIComponent(key);
  } catch {
    // keep the raw key
  }
  if (!isSafeStorageKey(key)) return new Response("Invalid storage key", { status: 400 });

  const bucket = getBucket();
  if (!bucket) return new Response("Storage not configured", { status: 500 });

  const object = await bucket.get(key, {
    range: request.headers as any,
    onlyIf: request.headers as any,
  });

  if (object) {
    const headers = new Headers();
    object.writeHttpMetadata(headers as any);
    if (!headers.get("content-type")) headers.set("content-type", guessContentType(key));
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    headers.set("accept-ranges", "bytes");

    // `onlyIf` precondition failed → no body
    if (!("body" in object) || !object.body) {
      return new Response(null, { status: 304, headers });
    }

    let status = 200;
    const range = (object as any).range as { offset?: number; length?: number; suffix?: number } | undefined;
    if (request.headers.has("range") && range) {
      const size = object.size;
      const offset = range.suffix !== undefined ? size - range.suffix : range.offset ?? 0;
      const length = range.suffix !== undefined ? range.suffix : range.length ?? size - offset;
      headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${size}`);
      headers.set("content-length", String(length));
      status = 206;
    } else {
      headers.set("content-length", String(object.size));
    }
    return new Response(request.method === "HEAD" ? null : (object.body as unknown as ReadableStream), { status, headers });
  }

  // Not in R2 yet: try the old Manus site once and keep a copy.
  // (Skipped for our own legacy fetches so a request can never call itself.)
  if (request.headers.has(LEGACY_FETCH_HEADER)) return new Response("Not found", { status: 404 });
  try {
    const imported = await importLegacyAsset(key);
    if (imported.stored && imported.body) {
      return new Response(request.method === "HEAD" ? null : imported.body, {
        status: 200,
        headers: {
          "content-type": imported.contentType || guessContentType(key),
          "cache-control": "public, max-age=86400",
        },
      });
    }
  } catch (error) {
    console.error("[Storage] Legacy import failed:", key, error);
  }
  return new Response("Not found", { status: 404 });
}

/**
 * Copies any files that are still only on the old Manus site into R2.
 * Stops early when the time budget is used so it fits inside one cron run.
 */
export async function importMissingLegacyAssets(
  keys: string[],
  options: { timeBudgetMs?: number } = {}
): Promise<{ total: number; alreadyInR2: number; copied: string[]; failed: string[]; remaining: number }> {
  const bucket = getBucket();
  if (!bucket) throw new Error("Storage not configured");
  const unique = Array.from(new Set(keys.filter(isSafeStorageKey)));
  const deadline = Date.now() + (options.timeBudgetMs ?? 60_000);
  const copied: string[] = [];
  const failed: string[] = [];
  let alreadyInR2 = 0;
  let processed = 0;
  for (const key of unique) {
    if (Date.now() > deadline) break;
    processed++;
    if (await bucket.head(key)) {
      alreadyInR2++;
      continue;
    }
    if (!legacyOrigins().length) {
      failed.push(`${key} (LEGACY_ASSET_ORIGIN not set)`);
      continue;
    }
    const result = await importLegacyAsset(key).catch(() => ({ stored: false, status: 0 }));
    if (result.stored) copied.push(key);
    else failed.push(`${key} (${result.status})`);
  }
  return { total: unique.length, alreadyInR2, copied, failed, remaining: unique.length - processed };
}
