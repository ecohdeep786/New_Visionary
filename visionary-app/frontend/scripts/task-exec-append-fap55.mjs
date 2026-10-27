/**
 * D3 closeout — append the final progress entries to the FAP-55 task record
 * in docs/architecture/tracking/task-executions.json (mirror line for
 * D3_EVIDENCE.md). Run from visionary-app: node ../scripts/... — invoked with
 * node frontend/scripts/task-exec-append-fap55.mjs from visionary-app root.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(new URL("../..", import.meta.url).pathname
  .replace(/^\/([A-Za-z]:)/, "$1")); // visionary-app (frontend/scripts -> visionary-app)
const FILE = join(ROOT, "docs", "architecture", "tracking", "task-executions.json");

const data = JSON.parse(readFileSync(FILE, "utf8"));
const list = Array.isArray(data)
  ? data
  : (data.tasks ?? data.entries ?? null);
if (!list) throw new Error("task-executions.json shape not recognized (no top-level list)");

const task = list.find?.((t) => t && t.jiraKey === "FAP-55");
if (!task || !Array.isArray(task.progress)) {
  throw new Error(`FAP-55 task with progress[] not found (found: ${list.map?.((t) => t?.jiraKey).filter?.(Boolean).join(", ")})`);
}

const at = (s) => s;
const items = [
  {
    at: at("2026-10-26T00:00:00.000Z"),
    item: "F10 monolith split delivered mechanically and verbatim: PersonaSections.jsx 958L -> 20 per-section modules + 19-name barrel, PremiumPersonaSections.jsx 1375L -> 7 modules + barrel, SpotIllustration.jsx 1223L -> dir (palette + 4 scene groups + index), LandingNav.jsx 785L -> dir (nav-data + nav-shared + index); split scripts committed (f10-split-persona/premium/spot-nav.mjs), bodies verified verbatim by substring containment; import sites unchanged",
  },
  {
    at: at("2026-10-26T00:05:00.000Z"),
    item: "Post-split wire proof: 134 chunks/3,098,409B (gzip 880,929B) -> 135 chunks (133 names)/3,088,080B (gzip 879,418B), 0 stale monolith chunks; chevron-only pages pay a 414B ChevronIcon shared chunk (old shared PersonaSections chunk 9.1KB gone); Landing loads its 4 needed premium sections via the 37.1KB PremiumExploreSection chunk and does NOT load the persona-only 30.3KB PremiumJourneyFlowSection chunk (07-language/09-achievement/10-journey excluded from /)",
  },
  {
    at: at("2026-10-26T00:10:00.000Z"),
    item: "QA law wall green after split: qa-perf budget recorded (grouped ledger patch for same-name chunk collisions) + fresh verify PASS; qa:continuity regenerated for new paths (same approved hex domain, nothing added/removed) PASS; qa:fonts PASS on production preview; qa:design PASS + qa:navigation PASS on their canonical dev harness; qa:taps PASS (245 controls/125 files); qa:motion PASS (438 files); lint clean; new f10-audit-bindings.mjs guard (rollup free-identifier law) clean after fixing 3 real header drifts",
  },
  {
    at: at("2026-10-26T00:15:00.000Z"),
    item: "Final Fast3G headless receipts via proxy (post-restart full rebuild, 135 chunks): / LCP 6,720 + 7,168 across two same-build runs (wire 331,362B pre-split-vs-post -877B; pre-F10 standing receipt 5,584 — spread bounds lab scheduling noise), /student LCP 5,960 (hero main 2400w AVIF), /teacher LCP 6,288; CLS 0.041/0.032/0.032; fontsDoubleFetched:false + staticFontFetched:false on all; LCP <2.5s AC honestly unmet on raw Fast3G (physics: 4 flex TTF ~505KB + 331KB JS + 95KB LCP art); edge-signature recorded, fast-LCP lever named as next-wave",
  },
  {
    at: at("2026-10-26T00:20:00.000Z"),
    item: "D3_EVIDENCE.md written to frontend/artifacts/research/continuity-2026-10-24/d3-performance/ (receipts table, F10 split record, chunk-graph proof, tooling law updates, incident/harness notes); final v2 comment posted on FAP-55; NO beta merge — awaiting independent reviewer per D-095 to record the exact reviewed commit",
  },
];

for (const it of items) task.progress.push(it);
writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n");
console.log(`appended ${items.length} FAP-55 progress entries + rewrote ${FILE}`);
