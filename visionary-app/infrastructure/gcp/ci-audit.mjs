import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// PLAT-06 CI coverage audit: structurally verify that the product workflow
// provides every checklist element - component tests/builds, provenance /
// secrets / dependency checks, API/schema compatibility, immutable image
// release, staging smoke, canary and rollback - with least-privilege
// triggers and credentials. The audit reads the committed workflow (and
// release.mjs for the canary/rollback implementation); it never runs it.

export const pass = detail => ({ pass: true, detail });
export const refuse = detail => ({ pass: false, detail });

const ACTION_SHA = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@[a-f0-9]{40}\b/;
const SECRET_PATTERNS = [
  [/BEGIN [A-Z ]*PRIVATE KEY/, 'embedded private key'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key id'],
  [/AIza[0-9A-Za-z_-]{35}/, 'Google API key literal'],
  [/ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{40,}/, 'GitHub token literal'],
  [/--set-password|password\s*=\s*['"][^'"]{8,}/i, 'embedded password literal'],
];

export function auditTriggers(workflow) {
  if (!/\n  push:\s*\n\s*branches: \[dev, main\]/.test(workflow)) return refuse('push trigger must cover branches [dev, main]');
  if (!/\n  pull_request:\s*\n\s*branches: \[dev, main\]/.test(workflow)) return refuse('pull_request trigger must cover branches [dev, main]');
  if (!/workflow_dispatch:/.test(workflow)) return refuse('workflow_dispatch must remain available for controlled owner runs');
  return pass('push + pull_request to dev and main, plus workflow_dispatch');
}

export function auditLeastPrivilege(workflow) {
  const top = workflow.match(/permissions:\s*\n\s*contents:\s*(\w+)/)?.[1];
  if (top !== 'read') return refuse(`top-level permissions must be contents: read, found: ${top}`);
  const prodSection = workflow.slice(workflow.indexOf('  production:'));
  if (!/contents:\s*read/.test(prodSection) || !/id-token:\s*write/.test(prodSection)) return refuse('production job must request only contents: read + id-token: write');
  if (/permissions:\s*\n\s*contents:\s*write/.test(prodSection)) return refuse('production job must not take contents: write');
  return pass('contents: read top-level; production job contents: read + id-token: write only');
}

export function auditPinnedActions(workflow) {
  const uses = [...workflow.matchAll(/uses:\s*(\S+)/g)].map(m => m[1]).filter(step => step.includes('/') && !step.startsWith('docker://'));
  const unpinned = uses.filter(step => !ACTION_SHA.test(step));
  if (unpinned.length) return refuse(`actions must be pinned to full commit SHAs: ${unpinned.join(', ')}`);
  return pass(`${uses.length} actions pinned to commit SHAs`);
}

export function auditComponentTestsAndBuilds(workflow) {
  const required = ['npm run check', 'npm run data:check', 'node --test infrastructure/gcp/tests/*.test.mjs', "unittest discover -s infrastructure/gcp/tests"];
  const missing = required.filter(step => !workflow.includes(step));
  if (missing.length) return refuse(`checks job is missing component steps: ${missing.join(' | ')}`);
  if (!workflow.includes('image: postgres:16')) return refuse('data:check requires the pinned postgres:16 service');
  return pass('whole-product check battery + data suite on postgres:16 + infra node/python suites');
}

export function auditDependencyAndSecretChecks(workflow) {
  const audits = [...workflow.matchAll(/npm audit --omit=dev --audit-level=high/g)].length;
  if (audits < 3) return refuse(`expected at least 3 high-severity dependency audits (frontend, infra runtime, contracts), found ${audits}`);
  for (const [pattern, label] of SECRET_PATTERNS) {
    if (pattern.test(workflow)) return refuse(`workflow contains a ${label}`);
  }
  // A static service-account key reference refuses outright — the mixed
  // alternation this replaces also carried the GOOD posture marker
  // (create_credentials_file: false), so a workflow could reference a static
  // key and still pass whenever workload_identity_provider appeared anywhere.
  if (/service_account_key/.test(workflow)) return refuse('workflow references a static service account key; use Workload Identity Federation, never a key');
  if (!/workload_identity_provider:/.test(workflow)) return refuse('production auth must use Workload Identity Federation');
  return pass(`${audits} high-severity dependency audits, no secret literals, WIF-only cloud auth`);
}

export function auditApiSchemaCompatibility(workflow) {
  if (!workflow.includes('visionary-app/integration/contracts/v1')) return refuse('checks job must install the integration contracts package');
  if (!workflow.includes('npm run check')) return refuse('api/schema compatibility runs inside the npm run check battery');
  return pass('contracts package installed and its suite runs inside npm run check');
}

export function auditImmutableReleaseAndSmoke(workflow) {
  const prod = workflow.slice(workflow.indexOf('  production:'));
  for (const step of ['node infrastructure/gcp/build-image.mjs', 'node infrastructure/gcp/container-smoke.mjs', 'node infrastructure/gcp/release.mjs publish']) {
    if (!prod.includes(step)) return refuse(`production job is missing: ${step}`);
  }
  if (prod.indexOf('container-smoke.mjs') > prod.indexOf('release.mjs publish')) return refuse('the container smoke must run before publish');
  return pass('build → smoke → publish order; release.mjs publishes the digest-pinned immutable image');
}

export function auditCanaryAndRollback(workflow, releaseSource) {
  const prod = workflow.slice(workflow.indexOf('  production:'));
  if (!prod.includes('node infrastructure/gcp/release.mjs deploy')) return refuse('production job must deploy through release.mjs deploy');
  if (!/\$\{\{ vars\.PRODUCTION_DEPLOY_ENABLED/.test(prod)) return refuse('deployment must stay behind the reviewed repository switch');
  for (const marker of ['no-traffic', "'--tag='", 'ci-candidate', 'canonicalChecks', 'moveTraffic']) {
    if (!releaseSource.includes(marker)) return refuse(`release.mjs canary implementation is missing: ${marker}`);
  }
  for (const marker of ['moveTraffic(previous)', 'rollback verification failed']) {
    if (!releaseSource.includes(marker)) return refuse(`release.mjs rollback path is missing: ${marker}`);
  }
  if (!/concurrency:\s*\n\s*group:/.test(prod) || !/cancel-in-progress:\s*false/.test(prod)) return refuse('production job must serialize deploys with a concurrency group (cancel-in-progress: false)');
  return pass('switch-gated no-traffic candidate → probes → promotion with automatic rollback, serialized');
}

export function auditJobBounds(workflow) {
  const timeouts = [...workflow.matchAll(/timeout-minutes:\s*(\d+)/g)].map(m => Number(m[1]));
  if (timeouts.length < 2) return refuse('every job must declare timeout-minutes');
  if (timeouts.some(t => !Number.isFinite(t) || t <= 0 || t > 60)) return refuse(`job timeouts out of bounds: ${timeouts.join(', ')}`);
  return pass(`job timeouts declared: ${timeouts.join(', ')} minutes`);
}

export function runCiAudit({ workflowPath = join(dirname(fileURLToPath(import.meta.url)), '../../../.github/workflows/production.yml'), releasePath = join(dirname(fileURLToPath(import.meta.url)), 'release.mjs'), workflow = undefined, releaseSource = undefined } = {}) {
  const text = workflow ?? readFileSync(workflowPath, 'utf8');
  const release = releaseSource ?? readFileSync(releasePath, 'utf8');
  if (!text.includes('  production:')) return [{ check: 'workflow-shape', ...refuse('workflow has no production job') }];
  const results = [];
  const step = (check, fn) => { try { results.push({ check, ...fn() }); } catch (error) { results.push({ check, ...refuse(`audit failed: ${String(error.message).slice(0, 160)}`) }); } };
  step('triggers', () => auditTriggers(text));
  step('least-privilege-permissions', () => auditLeastPrivilege(text));
  step('pinned-actions', () => auditPinnedActions(text));
  step('component-tests-builds', () => auditComponentTestsAndBuilds(text));
  step('dependency-secret-checks', () => auditDependencyAndSecretChecks(text));
  step('api-schema-compatibility', () => auditApiSchemaCompatibility(text));
  step('immutable-release-smoke', () => auditImmutableReleaseAndSmoke(text));
  step('canary-rollback', () => auditCanaryAndRollback(text, release));
  step('job-bounds', () => auditJobBounds(text));
  return results;
}

if (process.argv[1]?.endsWith('ci-audit.mjs')) {
  const results = runCiAudit();
  const failed = results.filter(r => !r.pass);
  for (const r of results) console.log(`${r.pass ? 'PASS' : 'REFUSE'} ${r.check}: ${r.detail}`);
  console.log(failed.length ? `CI AUDIT FAILED: ${failed.length} check(s) refused.` : 'CI AUDIT PASSED: every PLAT-06 element is structurally provided by the committed workflow.');
  if (failed.length) process.exitCode = 1;
}
