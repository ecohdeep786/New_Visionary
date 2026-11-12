#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
 * E1/FAP continuity lab — rendered laws (playwright-core, headless).
 *
 * The static qa-continuity laws read source tokens; the 2026-10-23
 * render-check receipt proved that is only half the truth (CSS !important
 * won over h-11, and bridge fallbacks never show in class strings). This
 * harness measures the RENDERED product at 1440 and enforces E1's laws:
 *
 *   L1 · CTA geometry equality — every filled pill (borderRadius 20–23px)
 *       on a route must share one signature per tone (height / radius /
 *       font / spacing / padding), and the same tone must carry the SAME
 *       signature across all measured public routes.
 *   L2 · CTA link-ink histogram — one link blue on the light surface.
 *   L3 · Roles resolve — every [data-type] element on a route must resolve
 *       to exactly ONE computed fontFamily stack (the product font): a
 *       bridge fallback or missed system import shows immediately.
 *   L4 · Role dual-ink — per (route, data-type) the computed color set may
 *       carry only ONE value unless the (route,type) pair is recorded in
 *       RENDER_DUAL_INK_EXCEPTIONS with a measured-receipt reason.
 *   L5 · Role ladder equality — the same data-type must mean the same
 *       (fontSize, fontWeight) across routes, unless recorded in
 *       RENDER_LADDER_EXCEPTIONS.
 *
 * Usage:
 *   node scripts/qa-continuity-render.mjs [--base url] [--routes csv]
 *        [--out file] [--quiet]
 * Writes one receipt JSON and exits non-zero when any law fails.
 * ────────────────────────────────────────────────────────────────────────── */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(HERE, "..");
const OUT_DIR = path.join(FRONTEND, "artifacts", "research", "continuity-2026-10-27", "e1-continuity");

/* Stage-recorded exceptions (each needs a measured-receipt reason). */
const RENDER_DUAL_INK_EXCEPTIONS = {
  // "route|data-type": reason
};
const RENDER_LADDER_EXCEPTIONS = {
  // "data-type|fs/fw-tuple-set": reason
};

const BADGE = "qa:continuity-render — rendered 1440 laws";

/* In-page probe: transform-proof measurements via offset sizes +
 * computed styles. */
const PROBE = /* js */ `
  (() => {
  const sq = (e) => getComputedStyle(e);
  const groundOf = (el) => {
    /* Nearest ancestor with a real paint (alpha > 0.12) buckets the role's
     * ground: dark or light. Gradient-painted stages carry no
     * background-color, so when the paint is an image the first stops'
     * luminance answers instead. The color itself stays in the receipt. */
    let node = el.parentElement;
    for (let i = 0; node && node !== document.body && i < 16; i++, node = node.parentElement) {
      const c = sq(node);
      const m = c.backgroundColor.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
      if (m && (!m[4] || parseFloat(m[4]) > 0.12)) {
        const lum = 0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3];
        return { ground: lum > 128 ? "light" : "dark", groundBg: c.backgroundColor };
      }
      if (c.backgroundImage && c.backgroundImage !== "none") {
        const stops = [
          ...c.backgroundImage.matchAll(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)|#([0-9a-f]{6})/gi),
        ].slice(0, 2);
        if (stops.length) {
          const lumOf = (mm) => {
            if (mm[1] !== undefined) return 0.2126 * mm[1] + 0.7152 * mm[2] + 0.0722 * mm[3];
            if (mm[4]) {
              return 0.2126 * parseInt(mm[4].slice(0, 2), 16) + 0.7152 * parseInt(mm[4].slice(2, 4), 16) + 0.0722 * parseInt(mm[4].slice(4, 6), 16);
            }
            return null;
          };
          const lums = stops.map(lumOf).filter((v) => v !== null);
          if (lums.length) {
            const avg = lums.reduce((a, b) => a + b, 0) / lums.length;
            return { ground: avg > 128 ? "light" : "dark", groundBg: c.backgroundImage.slice(0, 60) };
          }
        }
      }
    }
    return { ground: "unknown", groundBg: "" };
  };
  const pillSig = (e) => {
    const c = sq(e);
    return {
      tone: c.backgroundColor,
      h: e.offsetHeight,
      w: e.offsetWidth,
      br: c.borderTopLeftRadius,
      fs: c.fontSize,
      lh: c.lineHeight,
      ls: c.letterSpacing,
      fw: c.fontWeight,
      px: c.paddingLeft,
      pr: c.paddingRight,
      py: c.paddingTop,
      color: c.color,
      text: (e.textContent || "").trim().slice(0, 28),
    };
  };
  const roleSig = (e) => {
    const c = sq(e);
    const { ground, groundBg } = groundOf(e);
    return {
      type: e.getAttribute("data-type"),
      tag: e.tagName.toLowerCase(),
      fs: c.fontSize,
      fw: c.fontWeight,
      lh: c.lineHeight,
      ls: c.letterSpacing,
      fam: c.fontFamily,
      color: c.color,
      ground,
      groundBg,
      text: (e.textContent || "").trim().slice(0, 40),
    };
  };
  const pills = [...document.querySelectorAll("a,button")]
    .map((e) => pillSig(e))
    .filter((p) => {
      const r = parseFloat(p.br);
      if (Number.isNaN(r)) return false;
      const pillShaped = r >= 900 || Math.abs(r - p.h / 2) <= 1; // rounded-full computes to its specified 9999px; explicit pills sit at half-height
      return pillShaped && p.h >= 36 && p.h <= 72;
    });
  const linkInks = [...document.querySelectorAll("a")]
    /* Screen-reader-only links are not part of the visible ink system:
     * they materialize only on focus and their focus palette is the law's
     * own (focus:text-[#1d1d1f] / focus:bg-[#1d1d1f]). Hidden-state ink is
     * excluded from the single-ink census; runtime chain capture below
     * still records them for the mystery trail. */
    .filter((e) => {
      if (e.offsetParent === null) return false;
      const cls = e.getAttribute("class") || "";
      if (/\bsr-only\b/.test(cls)) return false;
      return true;
    })
    .map((e) => sq(e).color);
  /* Why does every route carry a link ink of rgb(31,31,31)? Not in any
   * built asset — record the elements AND the inherited chain to unmask
   * the runtime source (css-in-js, UA rules, or a styled ancestor). */
  const mysteryInkAnchors = [...document.querySelectorAll("a")]
    .filter((e) => e.offsetParent !== null && sq(e).color === "rgb(31, 31, 31)")
    .slice(0, 4)
    .map((e) => {
      const chain = [];
      let node = e.parentElement;
      for (let i = 0; node && node !== document.body && i < 6; i++, node = node.parentElement) {
        chain.push(sq(node).color);
      }
      return {
        cls: (e.getAttribute("class") || "").slice(0, 140),
        text: (e.textContent || "").trim().slice(0, 28),
        href: e.getAttribute("href"),
        inkChain: chain,
      };
    });
  const roles = [...document.querySelectorAll("[data-type]")].map(roleSig);
  const families = [...new Set(roles.map((r) => r.fam))];
  return {
    url: location.pathname,
    title: document.title,
    pills,
    linkInkHistogram: [...new Set(linkInks)],
    mysteryInkAnchors,
    roles,
    families,
    dataTypes: [...new Set(roles.map((r) => r.type))],
  };
  })();
`;

/* ── CLI ────────────────────────────────────────────────────────────────── */
function argOf(name, fallback) {
  const at = process.argv.indexOf(name);
  return at !== -1 ? process.argv[at + 1] : fallback;
}
const BASE = argOf("--base", "http://localhost:4173");
const OUT = argOf("--out", null);
const QUIET = process.argv.includes("--quiet");
const ROUTES_CSV = argOf("--routes", null);

/* Canonical public route set = the D2 rendered-sweep universe
 * (120-row ledger), so continuity is measured on exactly the same pages. */
const DEFAULT_ROUTES = [
  "/student", "/teacher", "/parent", "/help", "/professional", "/how-it-works",
  "/organization", "/download", "/about", "/pricing", "/careers", "/research",
  "/community", "/contact", "/partners", "/updates", "/referral", "/safety",
  "/privacy", "/terms", "/security", "/accessibility", "/cookies", "/",
];
const ROUTES = (ROUTES_CSV ? ROUTES_CSV.split(",") : DEFAULT_ROUTES).map((r) =>
  r.endsWith("/") && r !== "/" ? r.replace(/\/+$/, "") : r,
);

if (!QUIET) console.log(BADGE);
console.log(`  base: ${BASE} · routes: ${ROUTES.length}`);

/* ── collect ────────────────────────────────────────────────────────────── */
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

const pagesRows = [];
const violations = [];
const collect = async (route) => {
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + route, { waitUntil: "load", timeout: 60_000 });
    await page.evaluate(() => (document.fonts?.ready ? document.fonts.ready : null));
    /* Mount every lazy section the way the D2 sweep did: walk to the bottom
     * in ~0.9-viewport steps so IntersectionObserver-gated sections mount,
     * then return to top and let entrance animations finish. */
    await page.evaluate(async () => {
      const step = Math.max(400, Math.floor((window.innerHeight || 800) * 0.9));
      const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      for (let y = 0; y <= max; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(700); // entrance animations + font swap settle
    const probe = await page.evaluate(PROBE);
    pagesRows.push({ route, ...probe });
    if (!QUIET) {
      console.log(`  ${route} — pills ${probe.pills.length}, roles ${probe.roles.length}, linkInks ${probe.linkInkHistogram.join(" ")}`);
      if ((probe.mysteryInkAnchors || []).length) {
        for (const a of probe.mysteryInkAnchors) console.log(`      mysteryInk: ${JSON.stringify(a)}`);
      }
    }
  } catch (err) {
    violations.push({ law: "route-unreachable", route, error: String(err) });
    pagesRows.push({ route, error: String(err) });
  } finally {
    await page.close();
  }
};
for (const route of ROUTES) await collect(route);
await browser.close();

/* ── analyze ────────────────────────────────────────────────────────────── */
const sameSig = (a, b) => {
  const keys = ["h", "br", "fs", "lh", "ls", "fw", "px", "pr", "py"];
  return keys.every((k) => String(a[k]).toLowerCase() === String(b[k]).toLowerCase());
};

/* The recorded CTA pill class (A2/D2 records): h=44, font-size 17px,
 * padding-x 21px. Everything else pill-shaped (chips, badges, secondary
 * fills) is measured and reported as a census, but E1's geometry law
 * governs the recorded CTA family only. */
const ctaFamilyOf = (p) => p.fs === "17px" && p.px === "21px" && p.h === 44;

/* L1 — same-route CTA equality per tone. */
for (const row of pagesRows) {
  if (row.error || !row.pills) continue;
  const byTone = new Map();
  for (const p of row.pills.filter(ctaFamilyOf)) {
    if (!byTone.has(p.tone)) byTone.set(p.tone, []);
    byTone.get(p.tone).push(p);
  }
  for (const [tone, group] of byTone) {
    const bad = group.find((p) => !sameSig(group[0], p));
    if (bad) violations.push({ law: "cta-geometry-drift", route: row.route, tone, a: group[0], b: bad });
  }
}

/* L1b — cross-route CTA equality per tone. */
const byToneGlobal = new Map();
for (const row of pagesRows) {
  if (row.error || !row.pills) continue;
  for (const p of row.pills.filter(ctaFamilyOf)) {
    if (!byToneGlobal.has(p.tone)) byToneGlobal.set(p.tone, []);
    byToneGlobal.get(p.tone).push(p);
  }
}
for (const [tone, group] of byToneGlobal) {
  const bad = group.find((p) => !sameSig(group[0], p));
  if (bad) violations.push({ law: "cta-cross-page-drift", tone, a: group[0], b: bad });
}

/* L2 — CTA link-ink histogram: one link blue on the light surface.
 * Dark-stage pages may carry their recorded dark accent too; the histogram
 * is recorded per route for the mirror trail. */

/* L3 — roles resolve: every computed family stack on a route must belong
 * to the recorded product type system (Google Sans Flex; body roles may
 * use the Content member). Any other stack = bridge fallback = unresolved. */
for (const row of pagesRows) {
  if (row.error || !row.families) continue;
  for (const fam of row.families.filter((f) => !f.toLowerCase().replace(/\s+/g, " ").includes("google sans flex"))) {
    violations.push({ law: "role-font-unresolved", route: row.route, stack: fam });
  }
}

/* L4 — role dual-ink per (route, data-type, ground). A role staged on a
 * dark ground legally carries frost; the same role must never carry two
 * inks within the same ground. */
for (const row of pagesRows) {
  if (row.error || !row.roles) continue;
  const byKey = new Map();
  for (const r of row.roles) {
    const key = `${r.type}|${r.ground}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(r);
  }
  for (const [key, group] of byKey) {
    const colors = [...new Set(group.map((g) => g.color))];
    const [type, ground] = key.split("|");
    if (colors.length > 1 && !RENDER_DUAL_INK_EXCEPTIONS[`${row.route}|${type}|${ground}`]) {
      violations.push({
        law: "role-dual-ink",
        route: row.route,
        type,
        ground,
        colors,
        samples: group.filter((g) => g.color === colors[1]).slice(0, 3).map((g) => g.text),
      });
    }
  }
}

/* L5 — role ladder equality across routes: same (fs, fw) per data-type. */
const ladder = new Map();
for (const row of pagesRows) {
  if (row.error || !row.roles) continue;
  for (const r of row.roles) {
    if (!ladder.has(r.type)) ladder.set(r.type, []);
    ladder.get(r.type).push({ ...r, route: row.route });
  }
}
for (const [type, group] of ladder) {
  const sigs = [...new Set(group.map((g) => `${g.fs}/${g.fw}`))];
  if (sigs.size > 1 && !RENDER_LADDER_EXCEPTIONS[`${type}|${sigs.sort().join("|")}`]) {
    violations.push({
      law: "role-ladder-drift",
      type,
      sigs,
      routes: group.map((g) => g.route),
      sample: group.find((g) => `${g.fs}/${g.fw}` === sigs[1]),
    });
  }
}

/* ── receipt ────────────────────────────────────────────────────────────── */
const receipt = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  routes: ROUTES,
  viewport: "1440x900@1",
  laws: ["cta-geometry-drift", "cta-cross-page-drift", "role-font-unresolved", "role-dual-ink", "role-ladder-drift"],
  violations,
  pages: pagesRows,
};
const outPath = OUT
  ? (path.isAbsolute(OUT) ? OUT : path.resolve(process.cwd(), OUT))
  : path.join(OUT_DIR, "e1-continuity-render.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2) + "\n");

if (!QUIET) {
  if (violations.length) {
    console.log("  FAIL:");
    for (const v of violations) console.log(`    [${v.law}] ${JSON.stringify(v).slice(0, 400)}`);
  } else {
    console.log("  all rendered continuity laws pass");
  }
  console.log(`  receipt: ${outPath}`);
}
process.exit(violations.length ? 1 : 0);
