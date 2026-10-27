#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
 * D3/FAP performance law check — build budget. Static, dependency-free.
 *
 * Law: after `vite build`, every emitted JS chunk in dist/assets must stay
 * within its recorded budget (bytes, gzip estimated by ratio if a .gz report
 * is unavailable), and the whole emitted JavaScript payload must stay within
 * its recorded total budget. Budgets live in scripts/perf-budget.json,
 * machine-recorded (committed):
 *   - `record-baseline` mode snapshots the CURRENT dist output (run the build
 *     first), marking measured_at/task in the receipt.
 *   - verify mode (default) fails when a chunk exceeds budget beyond a 2%
 *     hashing/registry tolerance, when a chunk disappears, or when a NEW
 *     chunk appears without a budget line (fail-closed, like the surface
 *     audit) so later waves must re-record deliberately.
 *
 * The recorded receipts carry the D3 AC evidence: the vite build budget is
 * machine-recorded before and after the image law + monolith split work.
 *
 * Exit 0 when the budgets hold. `--out <file>` writes a JSON receipt.
 * QA_PERF_QUIET=1 suppresses the console summary (tests).
 * ────────────────────────────────────────────────────────────────────────── */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST_ASSETS = path.join(frontendRoot, "dist", "assets");
const BUDGET_PATH = path.join(frontendRoot, "scripts", "perf-budget.json");

const args = process.argv.slice(2);
const outArgIdx = args.indexOf("--out");
const OUT_PATH = outArgIdx >= 0 ? args[outArgIdx + 1] : null;
const doRecordBaseline = args.includes("--record-baseline");
const noteIdx = args.indexOf("--note");
const NOTE = noteIdx >= 0 ? args[noteIdx + 1] : null;

const TOLERANCE = 0.02; // 2% — chunk-hash/name churn tolerance

function measureDist() {
  const entries = [];
  for (const name of fs.readdirSync(DIST_ASSETS)) {
    if (!name.endsWith(".js")) continue;
    const bytes = fs.readFileSync(path.join(DIST_ASSETS, name));
    const gzip = zlib.gzipSync(bytes, { level: 9 }).length; // measured, not a ratio
    entries.push({ file: name, bytes: bytes.length, gzipBytes: gzip });
  }
  entries.sort((a, b) => b.bytes - a.bytes);
  return entries;
}

function chunkKey(file) {
  /* Vite asset names are `Name-HASH.js` (8-char base64url hash suffix) —
     budgets must survive content-hash churn, so lines are keyed by the
     hash-stripped name. Distinct emitted chunks may share one name (e.g.
     several `index-*.js` entries), so every name carries a GROUP: count +
     size arrays sorted descending, paired positionally at verify time —
     deterministic regardless of readdir order. */
  return file.replace(/-[A-Za-z0-9_-]{8}\.js$/i, ".js");
}

function groupByName(measured) {
  const groups = new Map();
  for (const m of measured) {
    const key = chunkKey(m.file);
    if (!groups.has(key)) groups.set(key, { sizes: [], gzip: [] });
    const g = groups.get(key);
    g.sizes.push(m.bytes);
    g.gzip.push(m.gzipBytes);
  }
  for (const g of groups.values()) {
    g.sizes.sort((a, b) => b - a);
    g.gzip.sort((a, b) => b - a);
  }
  return groups;
}

function verify() {
  const problems = [];
  if (!fs.existsSync(BUDGET_PATH)) {
    return { ok: false, problems: ["scripts/perf-budget.json missing — run --record-baseline after a build first"] };
  }
  const budget = JSON.parse(fs.readFileSync(BUDGET_PATH, "utf8"));
  if (!fs.existsSync(DIST_ASSETS)) return { ok: false, problems: ["dist/assets missing — run vite build first"] };

  const measured = measureDist();
  const groups = groupByName(measured);
  const byKey = new Map(budget.chunks.map((c) => [c.file, c]));
  /* backward compatibility — flat single-chunk ledger lines (pre-grouping) */
  for (const [key, rec] of [...byKey]) {
    if (!Array.isArray(rec.bytes)) {
      byKey.set(key, { file: key, count: 1, bytes: [rec.bytes], gzipBytes: [rec.gzipBytes ?? rec.bytes] });
    }
  }
  const seen = new Set();
  for (const [key, g] of groups) {
    seen.add(key);
    const rec = byKey.get(key);
    if (!rec) {
      problems.push(`new chunk ${key} (${g.sizes[0]}B) has no recorded budget — re-record budgets if this chunk is intended`);
      continue;
    }
    if (rec.count !== g.sizes.length) {
      problems.push(
        `${key}: ${g.sizes.length} chunk(s) emitted (sizes ${g.sizes.join("/")}) vs recorded ${rec.count} (sizes ${rec.bytes.join("/")}) — re-record budgets`
      );
      continue;
    }
    g.sizes.forEach((sz, i) => {
      if (sz > Math.ceil(rec.bytes[i] * (1 + TOLERANCE))) {
        problems.push(
          `${key} #${i + 1} ${sz}B exceeds recorded budget ${rec.bytes[i]}B (tolerance ${Math.round(TOLERANCE * 100)}%)`
        );
      }
    });
  }
  for (const key of byKey.keys()) {
    if (!seen.has(key)) problems.push(`recorded chunk ${key} no longer emitted — re-record budgets`);
  }
  const measuredTotal = measured.reduce((a, m) => a + m.bytes, 0);
  if (budget.totals && measuredTotal > Math.ceil(budget.totals.jsBytes * (1 + TOLERANCE))) {
    problems.push(
      `total JS ${measuredTotal}B exceeds recorded total budget ${budget.totals.jsBytes}B`
    );
  }
  return { ok: problems.length === 0, problems, budget, measured };
}

function recordBaseline() {
  if (!fs.existsSync(DIST_ASSETS)) {
    console.error("dist/assets missing — run vite build first");
    return false;
  }
  const measured = measureDist();
  const groups = groupByName(measured);
  const emitted = measured.length;
  const budget = {
    task: NOTE || "FAP-D3",
    measuredAt: new Date().toISOString(),
    tolerancePercent: Math.round(TOLERANCE * 100),
    ledgerShape: "grouped-by-name (count + sizes/gzip arrays sorted descending, paired positionally at verify)",
    chunks: [...groups].map(([file, g]) => ({
      file,
      count: g.sizes.length,
      bytes: g.sizes,
      gzipBytes: g.gzip,
    })),
    totals: {
      jsBytes: measured.reduce((a, m) => a + m.bytes, 0),
      jsGzipBytes: measured.reduce((a, m) => a + m.gzipBytes, 0),
    },
  };
  fs.writeFileSync(BUDGET_PATH, JSON.stringify(budget, null, 2) + "\n");
  console.log(
    `recorded ${emitted} JS chunks (${budget.chunks.length} names) | total ${budget.totals.jsBytes}B (gzip ${budget.totals.jsGzipBytes}B) -> scripts/perf-budget.json`
  );
  return true;
}

const result = doRecordBaseline
  ? (recordBaseline()
      ? { ok: true, recorded: true }
      : { ok: false, problems: ["record-baseline failed — dist/assets missing or unwritable"] })
  : verify();

if (OUT_PATH) {
  fs.writeFileSync(
    OUT_PATH,
    JSON.stringify(
      {
        law: "qa-perf build budget",
        at: new Date().toISOString(),
        ok: result.ok,
        totals: result.budget ? result.budget.totals : null,
        problems: result.problems || [],
      },
      null,
      2
    ) + "\n"
  );
}

if (!result.ok) {
  if (process.env.QA_PERF_QUIET !== "1") {
    console.error(`qa-perf FAILED\n${(result.problems || []).map((p) => "  - " + p).join("\n")}`);
  }
  process.exit(1);
}
if (process.env.QA_PERF_QUIET !== "1") {
  if (result.recorded) console.log("qa-perf: baseline recorded");
  else console.log(`qa-perf PASS: ${result.measured.length} chunks within recorded budgets`);
}
