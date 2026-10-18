// File storage on Cloudflare R2 (replaces Manus storage).
//
// Files are stored in the R2 bucket bound as `STORAGE` and served by the Worker
// at `/manus-storage/{key}`. That URL prefix is kept on purpose: every page,
// email and database row from the Manus era already points at it, so nothing
// has to be rewritten.

import { getBindings } from "./_core/runtime";

export const STORAGE_URL_PREFIX = "/manus-storage/";

function getBucket() {
  const bucket = getBindings().STORAGE;
  if (!bucket) {
    throw new Error("Storage is not configured: bind an R2 bucket as STORAGE in wrangler.jsonc");
  }
  return bucket;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").replace(/^manus-storage\//, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const bucket = getBucket();
  const key = appendHashSuffix(normalizeKey(relKey));
  const body = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  await bucket.put(key, body, { httpMetadata: { contentType } });
  return { key, url: `${STORAGE_URL_PREFIX}${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `${STORAGE_URL_PREFIX}${key}` };
}

/**
 * Returns a URL that serves the file. R2 objects are streamed through the
 * Worker, so this is the same stable site-relative path as `storageGet`.
 */
export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return `${STORAGE_URL_PREFIX}${key}`;
}

/** Deletes a stored file. Missing files are ignored. */
export async function storageDelete(relKey: string): Promise<void> {
  await getBucket().delete(normalizeKey(relKey));
}
