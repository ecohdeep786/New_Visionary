/* F-29 (Test Automation + Quality Lead): end-to-end release regression.
 * Executes every accumulated journey/audit harness (F-16..F-28) plus the
 * F-15 release gate against one preview-mode server, each into its own
 * subdirectory of the F-29 evidence tree (committed lane baselines stay
 * untouched), and writes one regression receipt with per-harness results.
 * The npm test battery, lint, typecheck, build and qa:perf run outside this
 * script (standard battery stages); this script covers the browser journeys
 * and the static cross-reference audits.
 * Env: REG_BASE_URL (default http://127.0.0.1:4198), REG_EVIDENCE_DIR. */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = process.env.REG_BASE_URL || 'http://127.0.0.1:4198';
const productRoot = fileURLToPath(new URL('../../', import.meta.url));
const frontendRoot = path.join(productRoot, 'frontend');
const evidence = path.resolve(productRoot, process.env.REG_EVIDENCE_DIR || 'docs/visionary/baseline/release-regression-' + new Date().toISOString().slice(0, 10) + '');
await fs.mkdir(evidence, { recursive: true });

const HARNESS = [
  { name: 'auth-ui', script: 'auth-ui-review.mjs', dir: 'auth-ui', env: 'AUTHUI' },
  { name: 'student', script: 'student-review.mjs', dir: 'student', env: 'STUDENT' },
  { name: 'teacher', script: 'teacher-review.mjs', dir: 'teacher', env: 'TEACHER' },
  { name: 'parent', script: 'parent-review.mjs', dir: 'parent', env: 'PARENT' },
  { name: 'professional', script: 'professional-review.mjs', dir: 'professional', env: 'PRO' },
  { name: 'organization', script: 'organization-review.mjs', dir: 'organization', env: 'ORG' },
  { name: 'cross-role', script: 'cross-role-review.mjs', dir: 'cross-role', env: 'CROSS' },
  { name: 'ml-experience', script: 'ml-experience-review.mjs', dir: 'ml-experience', env: 'ML' },
  { name: 'payments-consent', script: 'payments-consent-review.mjs', dir: 'payments-consent', env: 'TRUST' },
  /* CWV must measure the production build (vite preview on :4199) — the dev
   * server serves un-bundled modules and throttled numbers are meaningless. */
  { name: 'cwv', script: 'cwv-audit.mjs', dir: 'cwv', env: 'CWV', baseOverride: process.env.REG_PREVIEW_URL || 'http://127.0.0.1:4199' },
  { name: 'a11y-security', script: 'a11y-security-review.mjs', dir: 'a11y-security', env: 'A11Y' },
  { name: 'contract-audit', script: 'contract-audit.mjs', dir: 'contract-audit', env: 'CONTRACT' },
  { name: 'release-gate', script: 'release-gate.mjs', dir: 'release-gate', env: 'GATE' },
];

const results = [];
for (const h of HARNESS) {
  const dir = path.join(evidence, h.dir);
  await fs.mkdir(dir, { recursive: true });
  const started = new Date().toISOString();
  const harnessBase = h.baseOverride || base;
  const run = spawnSync(process.execPath, [path.join(frontendRoot, 'scripts', h.script)], {
    cwd: frontendRoot,
    encoding: 'utf8',
    timeout: 600000,
    windowsHide: true,
    /* The runner owns each harness's date-derived evidence directory, so it
     * explicitly authorizes the F-02 overwrite guard for its own children —
     * an operator running a harness by hand still gets the refusal. */
    env: { ...process.env, ALLOW_EVIDENCE_OVERWRITE: '1', [`${h.env}_BASE_URL`]: harnessBase, [`${h.env}_URL`]: harnessBase, [`${h.env}_EVIDENCE_DIR`]: dir },
  });
  const tail = (run.stdout || '').trim().split('\n').slice(-3).join(' | ').slice(0, 300);
  results.push({
    harness: h.name,
    script: h.script,
    exitCode: run.status,
    startedAt: started,
    seconds: run.status === null ? null : undefined,
    tail,
    stderr: (run.stderr || '').trim().split('\n').slice(-2).join(' | ').slice(0, 200),
  });
  console.log(`[${run.status === 0 ? 'PASS' : 'FAIL'}] ${h.name} (exit ${run.status}) — ${tail.slice(0, 160)}`);
}

const passed = results.filter((r) => r.exitCode === 0).length;
const receipt = {
  task: 'F-29 end-to-end release regression',
  at: new Date().toISOString(),
  base,
  summary: { harnesses: results.length, passed, failed: results.length - passed },
  results,
};
await fs.writeFile(path.join(evidence, 'regression-receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(`\nharnesses: ${passed}/${results.length} pass`);
console.log(`receipt: ${path.relative(productRoot, path.join(evidence, 'regression-receipt.json'))}`);
if (passed !== results.length) process.exit(1);
console.log('PASS release regression — every accumulated harness green');
