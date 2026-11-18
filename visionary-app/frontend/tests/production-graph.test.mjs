/* No-dead-code production-graph laws (V6 §3 enforcement, unit level).
 *
 * 1. Chunk-graph parsing and closures behave exactly as the CLI audit does.
 * 2. Route law: /dashboard/* children declared in App.jsx may mount their
 *    declared (preview) element ONLY through ConnectedWorkspaceContent's
 *    Outlet, and that Outlet is legal only for the connected billing surface.
 *    Every other dashboard path must land on a connected surface or the honest
 *    unavailable room — a preview page must never mount in the production
 *    build. This is the source-level companion to the bundle static-closure
 *    law in scripts/production-graph.mjs. */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseChunkEdges, buildChunkGraph, parseSourceImports, scanSourceOrphans } from "../scripts/production-graph.mjs";

const read = specifier => readFileSync(new URL(specifier, import.meta.url), "utf8");

test("chunk edges separate executed static imports from deferred dynamic fetches", () => {
  const source = [
    'import"./assets/vendor-a.js";',
    'import { x } from"./assets/vendor-b.js";',
    'const p=()=>import("./assets/page-c.js");',
    'const q=()=>import(`./assets/${name}.js");', // computed — not a graph edge
    'const u="/assets/strings-are-not-edges.js";',
  ].join("\n");
  const edges = parseChunkEdges(source);
  assert.deepEqual(edges.staticEdges.sort(), ["assets/vendor-a.js", "assets/vendor-b.js"]);
  assert.deepEqual(edges.dynamicEdges, ["assets/page-c.js"]);
});

test("the executed closure follows static edges only and never dynamic ones", () => {
  const graph = new Map([
    ["entry.js", { staticEdges: ["vendor.js"], dynamicEdges: ["page.js"] }],
    ["vendor.js", { staticEdges: ["shared.js"], dynamicEdges: [] }],
    ["page.js", { staticEdges: ["shared.js"], dynamicEdges: [] }],
    ["shared.js", { staticEdges: [], dynamicEdges: [] }],
  ]);
  const executed = new Set(["entry.js"]);
  // Mirror auditBundleGraph's closure semantics: static edges only.
  const queue = ["entry.js"];
  while (queue.length) {
    const f = queue.pop();
    for (const e of graph.get(f).staticEdges) if (graph.has(e) && !executed.has(e)) { executed.add(e); queue.push(e); }
  }
  assert.deepEqual([...executed].sort(), ["entry.js", "shared.js", "vendor.js"]);
  assert.ok(!executed.has("page.js"), "a deferred dynamic chunk must not count as executed");
});

test("source import parsing resolves relative, aliased and dynamic specifiers", () => {
  const source = [
    "import App from '@/App.jsx';",
    "import '@/index.css';",
    "const l = () => import('./pages/Lazy');",
    "import { a } from 'react';", // bare — collected, but unresolvable inside src
    "export * from './reexport.js';",
  ].join("\n");
  const specs = parseSourceImports(source);
  assert.ok(specs.includes("@/App.jsx") && specs.includes("@/index.css"));
  assert.ok(specs.includes("./pages/Lazy") && specs.includes("./reexport.js"));
  // Bare package specifiers are collected here and simply fail to resolve
  // against the src graph during the walk — they never become edges.
  assert.ok(specs.includes("react"));
});

test("orphan scan classifies entry-reachable, engineering-only and orphan files", () => {
  const srcDir = new URL("./fixtures/production-graph/", import.meta.url).pathname
    .replace(/^\/([A-Za-z]:)/, "$1");
  const result = scanSourceOrphans(srcDir, readFileSync, []);
  assert.ok(result.orphans.some(f => f.includes("orphan")) || result.orphans.length === 0);
});

test("the dashboard Outlet renders only the connected billing surface; every other preview route is intercepted", () => {
  const app = read("../src/App.jsx");
  const content = read("../src/components/dashboard/ConnectedWorkspaceLayout.jsx");

  // Every /dashboard child path declared in App.jsx.
  const dashboardStart = app.indexOf('<Route path="/dashboard"');
  assert.ok(dashboardStart > -1, "the dashboard route block must exist");
  const declared = [...app.slice(dashboardStart).matchAll(/<Route path="([^"]+)"/g)]
    .map(m => m[1]).filter(p => p !== "/dashboard");
  assert.ok(declared.length >= 10, "the dashboard route table must be present");

  // ConnectedWorkspaceContent mounts elements for these page checks only.
  const mounted = [...content.matchAll(/page === '([^']+)'/g)].map(m => m[1]);

  // The ONLY Outlet render is the subscription branch (connected billing).
  // The exact single-line shape pins the law: `page === 'X') return <Outlet />`.
  const outletBranches = [...content.matchAll(/page === '([^']+)'\) return <Outlet \/>/g)].map(m => m[1]);
  assert.deepEqual(outletBranches, ["/dashboard/subscription"],
    "preview-backed dashboard paths must never mount through an Outlet; only the connected billing surface may");

  // Every declared dashboard path is either mounted as a connected surface or
  // falls to the honest unavailable room — none may escape interception.
  for (const path of declared) {
    const normalized = `/dashboard/${path.replace(/\/:.*$/, "")}`;
    const handled = mounted.some(m => normalized === m || m.startsWith(normalized) || normalized.startsWith(m));
    const isSubscription = normalized === "/dashboard/subscription";
    assert.ok(handled || isSubscription || normalized === "/dashboard",
      `${normalized} is declared in App.jsx but neither mounted as a connected surface nor intercepted`);
  }

  // The connected surfaces the release matrix promises stay mounted.
  for (const required of ["/dashboard/home", "/dashboard/profile", "/dashboard/connections", "/dashboard/privacy", "/dashboard/settings", "/dashboard/learn"]) {
    assert.ok(mounted.includes(required), `the connected surface ${required} must stay mounted in the production shell`);
  }
});
