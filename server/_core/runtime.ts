/**
 * Cloudflare runtime bindings.
 *
 * The Worker entry (worker/index.ts) calls `setBindings(env)` on every request
 * and scheduled run, so server code can reach D1, R2 and static assets without
 * threading `env` through every function. In unit tests nothing is set and the
 * helpers return `undefined`, which the existing "database unavailable" paths
 * already handle.
 */

import type { D1Database, Fetcher, R2Bucket } from "@cloudflare/workers-types";

export type { D1Database, Fetcher, R2Bucket };

export type AppBindings = {
  /** Cloudflare D1 database (replaces the Manus-managed MySQL database). */
  DB?: D1Database;
  /** Cloudflare R2 bucket (replaces Manus storage). */
  STORAGE?: R2Bucket;
  /** Built front-end files served by Workers Static Assets. */
  ASSETS?: Fetcher;
  [key: string]: unknown;
};

let current: AppBindings = {};

export function setBindings(env: AppBindings) {
  current = env ?? {};
}

export function getBindings(): AppBindings {
  return current;
}

/** Background work that should finish after the response is sent. */
let waitUntilImpl: ((promise: Promise<unknown>) => void) | null = null;

export function setWaitUntil(fn: ((promise: Promise<unknown>) => void) | null) {
  waitUntilImpl = fn;
}

export function runInBackground(promise: Promise<unknown>) {
  const guarded = promise.catch(error => console.error("[Background] task failed:", error));
  if (waitUntilImpl) waitUntilImpl(guarded);
}
