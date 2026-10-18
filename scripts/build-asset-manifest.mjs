// Lists every file the site references under /manus-storage/ so the Worker can
// copy them from the old Manus site into Cloudflare R2.
// Runs automatically as part of `pnpm build`.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";

const roots = ["client/src", "client/index.html", "shared", "server"];
const exts = new Set([".ts", ".tsx", ".html", ".css", ".json", ".md"]);
const keys = new Set();

function walk(path) {
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) walk(join(path, entry));
    return;
  }
  if (!exts.has(extname(path)) || /\.test\.tsx?$/.test(path) || path.endsWith("legacyAssetManifest.json")) return;
  const text = readFileSync(path, "utf8");
  for (const match of text.matchAll(/\/manus-storage\/([A-Za-z0-9._%\/-]+)/g)) {
    const key = match[1].replace(/[.,)]+$/, "");
    if (key && !key.includes("${")) keys.add(key);
  }
}

for (const root of roots) walk(root);
const sorted = [...keys].sort();
writeFileSync("server/legacyAssetManifest.json", JSON.stringify(sorted, null, 2) + "\n");
console.log(`[asset-manifest] ${sorted.length} files listed in server/legacyAssetManifest.json`);
