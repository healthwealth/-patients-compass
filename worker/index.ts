/**
 * Cloudflare Worker entry for The Patient's Compass.
 *
 *  - Static front-end (dist/public) is served by Workers Static Assets.
 *  - /manus-storage/*  → files in R2 (copied from the old Manus site on first use)
 *  - /api/*, /sitemap.xml → the existing Express app, run through Workers' Node.js HTTP support
 *  - /super-kids       → SPA shell with page-specific SEO tags injected
 *  - Cron Trigger (hourly) → scheduled email/analytics jobs + legacy file copy
 */
import { createServer } from "node:http";
import { handleAsNodeRequest } from "cloudflare:node";
import { createApp } from "../server/app";
import { setBindings, setWaitUntil, type AppBindings } from "../server/_core/runtime";
import { handleStorageRequest, STORAGE_PATH_PREFIX } from "../server/_core/storageProxy";
import { applyRouteSeo } from "../server/routeSeo";
import { jobsDueAt } from "../server/_core/scheduledJobs";
import { CRON_SECRET_HEADER } from "../server/_core/sdk";
import { runLegacyFileImport } from "../server/handlers/migrationHandler";

type Env = AppBindings & {
  ASSETS: { fetch(request: Request): Promise<Response> };
  CRON_SECRET?: string;
  CANONICAL_HOST?: string;
  LEGACY_ASSET_ORIGIN?: string;
};

type Ctx = { waitUntil(promise: Promise<unknown>): void; passThroughOnException?(): void };
type ScheduledEvent = { scheduledTime: number; cron: string };

const NODE_PORT = 8080;
createServer(createApp()).listen(NODE_PORT);

function prepare(env: Env, ctx: Ctx) {
  setBindings(env);
  setWaitUntil(promise => ctx.waitUntil(promise));
}

/** Forwards a request to Express with the usual proxy headers. */
function toExpress(request: Request, env: Env, ctx: Ctx) {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  headers.set("x-forwarded-proto", url.protocol.replace(":", ""));
  headers.set("x-forwarded-host", url.host);
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) headers.set("x-forwarded-for", ip);
  const forwarded = new Request(request, { headers });
  return handleAsNodeRequest(NODE_PORT, forwarded, env, ctx);
}

async function serveSeoShell(request: Request, env: Env) {
  const url = new URL(request.url);
  const shell = await env.ASSETS.fetch(new Request(new URL("/index.html", url), { headers: request.headers }));
  if (!shell.ok) return shell;
  const html = applyRouteSeo(await shell.text(), url.pathname);
  const headers = new Headers(shell.headers);
  headers.delete("content-length");
  headers.delete("etag");
  headers.set("content-type", "text/html; charset=utf-8");
  return new Response(html, { status: 200, headers });
}

function isDynamicPath(pathname: string) {
  return pathname.startsWith("/api/") || pathname === "/api" || pathname === "/sitemap.xml";
}

export default {
  async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
    prepare(env, ctx);
    const url = new URL(request.url);

    // Optional: send www/old hostnames to the main domain.
    if (env.CANONICAL_HOST && url.hostname !== env.CANONICAL_HOST && url.hostname.endsWith(env.CANONICAL_HOST)) {
      url.hostname = env.CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    try {
      if (url.pathname.startsWith(STORAGE_PATH_PREFIX)) return await handleStorageRequest(request);
      if (isDynamicPath(url.pathname)) return await toExpress(request, env, ctx);
      if (url.pathname === "/super-kids" && (request.method === "GET" || request.method === "HEAD")) {
        return await serveSeoShell(request, env);
      }
      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error("[Worker] Unhandled error:", url.pathname, error);
      return new Response("Something went wrong. Please try again.", { status: 500 });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: Ctx): Promise<void> {
    prepare(env, ctx);
    const due = jobsDueAt(new Date(event.scheduledTime));
    console.log(`[Cron] ${new Date(event.scheduledTime).toISOString()} — due: ${due.map(job => job.name).join(", ") || "none"}`);

    if (due.length && !env.CRON_SECRET) {
      console.error("[Cron] CRON_SECRET is not set — scheduled emails are skipped.");
    } else {
      for (const job of due) {
        try {
          const response = await toExpress(
            new Request(`https://cron.internal${job.path}`, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                [CRON_SECRET_HEADER]: env.CRON_SECRET ?? "",
                "x-cron-task": job.name,
              },
              body: "{}",
            }),
            env,
            ctx
          );
          console.log(`[Cron] ${job.name}: ${response.status} ${(await response.text()).slice(0, 500)}`);
        } catch (error) {
          console.error(`[Cron] ${job.name} failed:`, error);
        }
      }
    }

    // Keep copying any files still only on the old Manus site into R2.
    if (env.LEGACY_ASSET_ORIGIN) {
      try {
        const result = await runLegacyFileImport(10 * 60 * 1000);
        if (result.copied.length || result.failed.length) {
          console.log(`[Cron] legacy files: ${result.copied.length} copied, ${result.failed.length} failed, ${result.remaining} remaining`, result.failed.slice(0, 20));
        }
      } catch (error) {
        console.error("[Cron] legacy file import failed:", error);
      }
    }
  },
};
