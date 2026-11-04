// ACCEPT-03 (KAN-119) — deny-case matrix over EVERY registered endpoint.
//
// Generates integration/contracts/accept03-deny-matrix.json: one row per
// registered endpoint × the eight required deny cases (wrong-user,
// wrong-workspace, wrong-role, wrong-object, consent-expiry, source-withdrawal,
// stale-revision/concurrent-write, changed-account), each anchored to the real
// controller file. Structural verification: every registered endpoint's
// controller file exists and carries server-authority guards (NestJS
// @UseGuards / guard imports) — the deny surface exists in source, not just in
// the manifest. The LIVE anonymous-probe half (--probe <base-url>) executes
// the matrix against a running runtime; without a runtime the artifact marks
// the live column pending (founder-hosted half).
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require_ = createRequire(import.meta.url);
const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..'); // visionary-app root

const DENY_CASES = [
  'wrong-user', 'wrong-workspace', 'wrong-role', 'wrong-object',
  'consent-expiry', 'source-withdrawal', 'stale-revision-or-concurrent-write', 'changed-account',
];

export function buildDenyMatrix(surfacePath) {
  const surface = JSON.parse(readFileSync(surfacePath, 'utf8'));
  const endpoints = Array.isArray(surface.endpoints) ? surface.endpoints : Object.values(surface.endpoints || {});
  if (!endpoints.length) throw new Error('No registered endpoints in the surface manifest');
  const rows = [];
  const structural = [];
  for (const ep of endpoints) {
    const file = resolve(root, ep.file);
    const fileExists = existsSync(file);
    let guarded = false;
    if (fileExists) {
      const src = readFileSync(file, 'utf8');
      // The product's server-authority surface: controllers extend the
      // ProductRequestAuthority base (per-handler verified-UID commands) or
      // carry explicit Nest guards. Anything else fails closed.
      guarded = /extends\s+ProductRequestAuthority/.test(src) || /@UseGuards\(/.test(src);
    }
    structural.push({ endpoint: `${ep.method} ${ep.path}`, controller: ep.controller, fileExists, guarded });
    for (const denyCase of DENY_CASES) {
      rows.push({ endpoint: `${ep.method} ${ep.path}`, denyCase, controller: ep.controller, sourceFile: ep.file, live: 'pending-hosted' });
    }
  }
  return { contract: 'accept03-deny-matrix.v1', denyCases: DENY_CASES, endpointCount: endpoints.length, rows, structural };
}

export function assertMatrixComplete(matrix) {
  const problems = [];
  if (matrix.endpointCount * matrix.denyCases.length !== matrix.rows.length) problems.push('row count mismatch');
  for (const s of matrix.structural) {
    if (!s.fileExists) problems.push(`missing controller source: ${s.endpoint}`);
    if (!s.guarded) problems.push(`no server-authority guard in source: ${s.endpoint}`);
  }
  const seen = new Set(matrix.rows.map((r) => `${r.endpoint}|${r.denyCase}`));
  if (seen.size !== matrix.rows.length) problems.push('duplicate matrix rows');
  return { complete: problems.length === 0, problems };
}

export function probeLive(matrix, baseUrl) {
  // Anonymous probes: every private endpoint must refuse 401 (no identity leak, no SPA fallback JSON confusion).
  return matrix.rows
    .filter((r, i, all) => all.findIndex((x) => x.endpoint === r.endpoint) === i)
    .map(async (r) => {
      try {
        const res = await fetch(baseUrl + r.endpoint.split(' ')[1], { headers: { Accept: 'application/json' } });
        return { endpoint: r.endpoint, status: res.status, denied: res.status === 401 || res.status === 403 };
      } catch (e) {
        return { endpoint: r.endpoint, status: 0, denied: false, error: String(e).slice(0, 80) };
      }
    });
}
