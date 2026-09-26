import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, dirname, resolve } from "path";

/* Wave L0 — (1) route inventory  (2) link crawl  (3) token extraction */
const ROOT = process.cwd();
const SRC = join(ROOT, "src");

/* ── 1. Route inventory from App.jsx ─────────────────────────── */
const app = readFileSync(join(SRC, "App.jsx"), "utf8");
const routes = new Set();
for (const m of app.matchAll(/path="([^"]+)"/g)) routes.add(m[1]);
const flat = [...routes].filter((r) => r.startsWith("/"));
const LINK_MAP_ROUTES = ["/", "/student", "/teacher", "/parent", "/professional", "/organization",
  "/how-it-works", "/pricing", "/download", "/about", "/research", "/community", "/updates",
  "/partners", "/referral", "/privacy", "/terms", "/cookies", "/safety", "/security",
  "/accessibility", "/careers", "/contact", "/register", "/signin", "/404"];

const inRepoNotMap = flat.filter((r) => !LINK_MAP_ROUTES.includes(r));
const inMapNotRepo = LINK_MAP_ROUTES.filter((r) => !routes.has(r) && r !== "/signin" && r !== "/404");

/* ── collect public page files ───────────────────────────────── */
const pageFiles = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".jsx") && /src[\\/]pages/.test(p) && !p.includes("dashboard")) pageFiles.push(p);
  }
})(SRC);

/* map route -> file for cross-page anchor checks */
const routeToFile = {};
for (const line of app.split("\n")) {
  const m = line.match(/import\('(.+?)'\)/) || line.match(/^import .* from '(.+?)'/);
}
const lazyMap = new Map();
for (const m of app.matchAll(/const (\w+) = lazy\(\(\) => import\('(.+?)'\)\)/g)) lazyMap.set(m[1], m[2]);
for (const m of app.matchAll(/<Route path="([^"]+)" element=\{<(\w+)/g)) {
  const spec = lazyMap.get(m[2]);
  if (spec) routeToFile[m[1]] = resolve(SRC, spec.replace("@/", "").replace(/^\//, "") + ".jsx");
}

/* ── 2. Link crawl ───────────────────────────────────────────── */
const findings = [];
const allLinks = new Map(); // href -> [where]
const anchored = [];

function scanFile(file, label) {
  const src = readFileSync(file, "utf8");
  const targets = new Set();
  for (const m of src.matchAll(/to=\{?"([^"$]+)"\}?/g)) targets.add(m[1]);
  for (const m of src.matchAll(/(?:to|path|slug|href):\s*"([^"]+)"/g)) targets.add(m[1]);
  for (const to of targets) {
    if (to.startsWith("#") || to.includes("#")) {
      const [path, hash] = to.split("#");
      anchored.push({ from: label, to, path: path || "(self)", hash });
    } else if (to !== "" && !/^https?:/.test(to)) {
      const norm = (to.startsWith("/") ? to : "/" + to).split("?")[0]; // strip query (plan params resolve to real routes)
      if (!allLinks.has(norm)) allLinks.set(norm, []);
      allLinks.get(norm).push(label);
    }
  }
}
for (const f of pageFiles) scanFile(f, f.split(/[\\/]/).pop());
scanFile(join(SRC, "components/landing/LandingNav.jsx"), "LandingNav.jsx");
scanFile(join(SRC, "components/landing/LandingFooter.jsx"), "LandingFooter.jsx");
scanFile(join(SRC, "lib/PageNotFound.jsx"), "PageNotFound.jsx");
try { scanFile(join(SRC, "data/landingCategories.js"), "landingCategories.js"); } catch {}

/* dead route links */
for (const [to, where] of allLinks) {
  if (/^https?:/.test(to)) continue;
  const base = to.split("#")[0];
  if (base && !routes.has(base) && base !== "") findings.push(`DEAD-LINK: to="${to}" used in ${[...new Set(where)].join(", ")}`);
}
/* orphan routes: no page/nav/footer links to them (entry via / allowed) */
for (const r of flat) {
  if (r === "/" || r === "*") continue;
  const linked = [...allLinks.keys()].some((k) => k === r || k.startsWith(r + "#") || k.startsWith(r + "?"));
  if (!linked) findings.push(`ORPHAN-ROUTE: ${r} reachable from nowhere in crawl`);
}
/* anchor targets */
for (const a of anchored) {
  const targetFile = a.path === "(self)" ? null : routeToFile[a.path];
  if (a.path !== "(self)" && !targetFile) { findings.push(`ANCHOR-UNKNOWN-PAGE: ${a.from} → ${a.to} (target page not in route map)`); continue; }
  const file = targetFile || pageFiles.find((f) => f.endsWith(a.from.replace(".jsx", ".jsx")));
  if (!file) continue;
  const src = readFileSync(file, "utf8");
  if (!src.includes(`id="${a.hash}"`)) findings.push(`DEAD-ANCHOR: ${a.from} → ${a.to} (no id="${a.hash}" in target)`);
}

/* ── 3. Token extraction ─────────────────────────────────────── */
const tokens = {};
const hexDrift = [];
const SPEC = { ink: "#121317", blue: "#4285F4", grey: "#5f6368", slate: "#5f6368", lightGrey: "#9AA0A6", mist: "#dadce0", surface: "#F5F6F8", chipBg: "#D2E3FC", cardSurface: "#EEF1F6" };
for (const f of [...pageFiles, join(SRC, "components/landing/LandingNav.jsx"), join(SRC, "components/landing/LandingFooter.jsx")]) {
  const src = readFileSync(f, "utf8");
  const label = f.split(/[\\/]/).pop();
  for (const m of src.matchAll(/(ink|blue|grey|slate|lightGrey|mist|surface|chipBg|cardSurface|cardSurfaceAlt|white|graphite):\s*"([^"]+)"/g)) {
    const key = `${m[1]}=${m[2].toUpperCase()}`;
    tokens[key] = (tokens[key] || 0) + 1;
  }
  for (const m of src.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
    const hex = m[0].toUpperCase();
    if (!Object.values(SPEC).map(x=>x.toUpperCase()).includes(hex) && !["#FFFFFF", "#F8F9FA", "#E9EFFA", "#FBBC04", "#E8F0FE", "#174EA6", "#DADCE0", "#F8FAFD", "#202124", "#1A73E8", "#E6F4EA", "#137333", "#B3261E", "#FCE8E6", "#F2B8B5", "#F1F3F4", "#BDC1C6", "#747775", "#3C4043", "#E5E7EB"].includes(hex)) {
      hexDrift.push(`${label}: ${hex}`);
    }
  }
}

/* ── report ──────────────────────────────────────────────────── */
const out = {
  routes: { repo: flat.sort(), inRepoNotMap, inMapNotRepo },
  linkCrawl: { totalUniqueTargets: allLinks.size, findings },
  tokens: { shared: tokens, adhocHexOutsidePalette: [...new Set(hexDrift)] },
};
writeFileSync("l0-report.json", JSON.stringify(out, null, 1));
console.log("ROUTES in repo but not LINK_MAP:", inRepoNotMap.join(" ") || "none");
console.log("LINK_MAP but not repo:", (inMapNotRepo.includes("/signin") ? ["/signin (repo has /login)"] : inMapNotRepo).join(" ") || "none");
console.log("\nCRAWL FINDINGS (" + findings.length + "):");
for (const f of findings) console.log(" -", f);
console.log("\nAD-HOC HEX outside palette (" + out.tokens.adhocHexOutsidePalette.length + "):", out.tokens.adhocHexOutsidePalette.slice(0, 12).join(" · "));
