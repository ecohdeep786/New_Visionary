/**
 * No-dead-code production-graph verifier (V6 §3 enforcement).
 *
 * Three audits, one CLI (`node scripts/production-graph.mjs`):
 *
 * 1. Bundle static-closure law — from the built dist/, compute the chunk set a
 *    production user downloads and EXECUTES (entry + transitive static imports;
 *    dynamic import() edges are deferred fetches, not executions). The
 *    development preview store (`workspaceService`) must never sit in that set:
 *    if it did, every production visitor would download browser-local-authority
 *    code on first paint. Pinned by the FHE-05 composition law at source level;
 *    this proves the built artifact keeps the promise.
 *
 * 2. Orphan-source scan — every file under src/ must be reachable from the app
 *    entry (src/main.jsx) or from an engineering root (tests/, scripts/). Files
 *    reachable from NO root are true orphans (abandoned work) and fail the
 *    audit. Files reachable only from engineering roots are reported as
 *    product-dead and must be registered or removed by their owner.
 *
 * 3. Inventory — counts of each class, so the law stays visible in receipts.
 *
 * The route-interception law (which /dashboard/* paths may mount their declared
 * element) is a source-level invariant; see tests/production-graph.test.mjs.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* Registered intentional non-entry files. Each entry needs a reason and an
 * owner, recorded here and in docs/architecture/FRONTEND_NO_DEAD_CODE_LAW.md.
 * Anything not on this list and unreachable from every root fails the audit. */
const REGISTERED = new Map([
  // V6 §5 backend client seam: the typed adapter contract backend/ML owners
  // implement against, exercised by tests/backend-transport.test.mjs. Not yet
  // wired into a production route by design — wiring happens with the owning
  // service lane, never silently.
  ["src/services/backendtransport.ts", "registered backend/ML adapter seam (V6 §5); tests/backend-transport.test.mjs"],
]);

/* Extract relative cross-chunk references (`./name`) from a built chunk.
 * Vite emits static edges as `import"./x.js"`/`from"./x.js"` and deferred
 * edges as `import("./x.js")`. Only relative refs are graph edges; URL-string
 * references and bare specifiers are not. */
export function parseChunkEdges(source) {
  const collect = pattern => [...source.matchAll(pattern)].map(m => m[1]);
  const staticEdges = collect(/(?:\bfrom\s*|\bimport\s*)"\.\/([^"]+)"/g);
  const dynamicEdges = collect(/\bimport\(\s*"\.\/([^"]+)"\s*\)/g);
  return { staticEdges, dynamicEdges };
}

export function buildChunkGraph(assetDir, readFile = readFileSync) {
  const graph = new Map();
  for (const file of readdirSync(assetDir).filter(f => f.endsWith(".js"))) {
    graph.set(file, parseChunkEdges(readFile(join(assetDir, file), "utf8")));
  }
  return graph;
}

function closure(graph, roots, pick) {
  const seen = new Set(roots);
  const queue = [...roots];
  while (queue.length) {
    const file = queue.pop();
    for (const edge of graph.get(file)?.[pick] ?? []) {
      if (graph.has(edge) && !seen.has(edge)) { seen.add(edge); queue.push(edge); }
    }
  }
  return seen;
}

export function auditBundleGraph(assetDir, readFile = readFileSync, entryOverride = null) {
  const graph = buildChunkGraph(assetDir, readFile);
  const html = (() => {
    try { return readFile(join(dirname(assetDir), "index.html"), "utf8"); }
    catch { return readFile(join(assetDir, "..", "index.html"), "utf8"); }
  })();
  const htmlJs = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map(m => m[1].split("/").pop());
  const entries = entryOverride ?? htmlJs.filter(f => graph.has(f));
  if (!entries.length) throw new Error("No entry chunk found in dist/index.html.");
  const executed = closure(graph, entries, "staticEdges");
  // Deferred fetch set: static + dynamic edges, transitively.
  const merged = new Map([...graph].map(([f, e]) => [f, { staticEdges: [...e.staticEdges, ...e.dynamicEdges], dynamicEdges: [] }]));
  const reachable = closure(merged, entries, "staticEdges");
  const previewStoreChunks = [...executed].filter(f => /^workspaceService/.test(f));
  return {
    entries, chunkCount: graph.size,
    executedCount: executed.size, reachableCount: reachable.size,
    executed: [...executed].sort(),
    deferredOnly: [...graph.keys()].filter(f => !reachable.has(f)).sort(),
    previewStoreInExecutedClosure: previewStoreChunks,
    previewStoreFetchedByExecuted: [...executed].flatMap(f => graph.get(f).staticEdges)
      .filter(e => /^workspaceService/.test(e)),
  };
}

/* Source import scan: resolve relative and `@/` specifiers against src/. */
const IMPORT_SPECS = [
  /(?:\bfrom\s*|\bimport\s*|\bimport\(\s*)["']([^"']+)["']/g,
];
export function parseSourceImports(source) {
  const specs = new Set();
  for (const pattern of IMPORT_SPECS) {
    for (const m of source.matchAll(pattern)) specs.add(m[1]);
  }
  return [...specs];
}

export function scanSourceOrphans(srcDir, readFile = readFileSync, extraRootsDirs = []) {
  const files = [];
  const walk = dir => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(js|jsx|ts|tsx|css)$/.test(entry)) files.push(full);
    }
  };
  walk(srcDir);
  const normalize = f => f.replaceAll("\\", "/").toLowerCase();
  const byPath = new Map(files.map(f => [normalize(f), f]));
  const resolveSpec = (fromFile, spec) => {
    let target = null;
    if (spec.startsWith("@/")) target = join(srcDir, spec.slice(2));
    else if (spec.startsWith(".")) target = resolve(dirname(fromFile), spec);
    else return null; // bare package specifier — outside the src graph
    for (const candidate of [
      target,
      `${target}.js`, `${target}.jsx`, `${target}.ts`, `${target}.tsx`, `${target}.css`,
      join(target, "index.js"), join(target, "index.jsx"),
    ]) {
      const hit = byPath.get(normalize(candidate));
      if (hit) return hit;
    }
    return null;
  };
  const walkFiles = dir => {
    const out = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...walkFiles(full));
      else if (/\.(mjs|js|jsx)$/.test(entry)) out.push(full);
    }
    return out;
  };
  // Roots: the app entry plus every engineering file (tests, scripts). Engineering
  // files may import product modules — a module used only by engineering is not
  // product-reachable and is reported separately below.
  const roots = [join(srcDir, "main.jsx")];
  for (const dir of extraRootsDirs) roots.push(...walkFiles(dir));
  const seen = new Set();
  const queue = roots.filter(r => byPath.has(normalize(r)));
  const srcRoots = new Set(roots.filter(r => normalize(r).startsWith(normalize(srcDir))).map(normalize));
  const engineeringOnly = new Set(roots.filter(r => !normalize(r).startsWith(normalize(srcDir))).map(normalize));
  while (queue.length) {
    const file = queue.pop();
    const key = normalize(file);
    if (seen.has(key)) continue;
    seen.add(key);
    for (const spec of parseSourceImports(readFile(file, "utf8"))) {
      const target = resolveSpec(file, spec);
      if (target) queue.push(target);
    }
  }
  // .d.ts files are ambient type declarations consumed by tsc (jsconfig includes
  // src/**), not runtime modules — reported separately, never "orphans".
  const typeLayer = files.filter(f => f.endsWith(".d.ts")).sort();
  const normalizeKey = f => normalize(f).split("/frontend/").pop();
  const orphans = files
    .filter(f => !f.endsWith(".d.ts") && !seen.has(normalize(f)) && !REGISTERED.has(normalizeKey(f)))
    .sort();
  const registered = [...REGISTERED.keys()].sort();
  const productDead = files.filter(f => !f.endsWith(".d.ts") && seen.has(normalize(f)) && engineeringOnly.has(normalize(f))).sort();
  return { total: files.length, reachableFromEntry: seen.size, orphans, productDead, typeLayer, registered, srcRootCount: srcRoots.size };
}

function cli() {
  const distAssets = join(root, "dist", "assets");
  const report = {};
  let failed = false;
  try {
    report.bundle = auditBundleGraph(distAssets);
    report.laws = {
      previewStoreOutOfExecutedClosure:
        report.bundle.previewStoreInExecutedClosure.length === 0 &&
        report.bundle.previewStoreFetchedByExecuted.length === 0,
    };
    if (!report.laws.previewStoreOutOfExecutedClosure) failed = true;
  } catch (error) {
    report.bundleError = String(error.message);
    failed = true;
  }
  try {
    report.sources = scanSourceOrphans(join(root, "src"), readFileSync, [
      join(root, "tests"), join(root, "scripts"),
    ]);
    if (report.sources.orphans.length) failed = true;
  } catch (error) {
    report.sourceError = String(error.message);
    failed = true;
  }
  console.log(JSON.stringify(report, null, 2));
  if (failed) {
    console.error("Production-graph law violated. Review the report above; fix or register the finding with its owner.");
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli();
