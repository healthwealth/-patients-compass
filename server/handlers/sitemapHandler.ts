import type { Request, Response } from "express";
import { asc, eq } from "drizzle-orm";
import { blogPosts } from "../../drizzle/schema";
import { getDb } from "../db";

const CANONICAL_ORIGIN = "https://thepatientscompass.com";

const STATIC_URLS = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/pricing", changefreq: "monthly", priority: "0.9" },
  { path: "/books", changefreq: "monthly", priority: "0.9" },
  { path: "/features", changefreq: "monthly", priority: "0.8" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/super-kids", changefreq: "monthly", priority: "0.8" },
  { path: "/manus-storage/Healthy_Habits_Super_Kids_Free_Printables_8b45bee6.pdf", changefreq: "yearly", priority: "0.6" },
  { path: "/biomarkers", changefreq: "weekly", priority: "0.9" },
  { path: "/lifestyle", changefreq: "weekly", priority: "0.8" },
  { path: "/medical-assistant", changefreq: "weekly", priority: "0.8" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/support", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.4" },
  { path: "/terms", changefreq: "yearly", priority: "0.4" },
] as const;

export type PublishedBlogSitemapEntry = {
  slug: string;
  updatedAt: Date | null;
  publishedAt: Date | null;
};

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;",
  })[character] ?? character);
}

function asDateString(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function buildSitemapXml(posts: PublishedBlogSitemapEntry[]) {
  const staticEntries = STATIC_URLS.map(
    ({ path, changefreq, priority }) => `  <url>\n    <loc>${CANONICAL_ORIGIN}${path}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  );

  const articleEntries = posts.map((post) => {
    const lastmod = asDateString(post.updatedAt ?? post.publishedAt);
    return [
      "  <url>",
      `    <loc>${CANONICAL_ORIGIN}/blog/${escapeXml(post.slug)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      "    <changefreq>monthly</changefreq>",
      "    <priority>0.7</priority>",
      "  </url>",
    ].filter(Boolean).join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticEntries,
    ...articleEntries,
    "</urlset>",
  ].join("\n");
}

export async function sitemapHandler(_req: Request, res: Response) {
  try {
    const db = await getDb();
    const posts = db
      ? await db
          .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt, publishedAt: blogPosts.publishedAt })
          .from(blogPosts)
          .where(eq(blogPosts.published, 1))
          .orderBy(asc(blogPosts.slug))
      : [];

    res.type("application/xml").send(buildSitemapXml(posts));
  } catch (error) {
    console.error("[Sitemap] Failed to load published articles:", error);
    res.type("application/xml").status(500).send(buildSitemapXml([]));
  }
}
