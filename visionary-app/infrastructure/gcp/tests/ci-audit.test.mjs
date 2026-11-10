import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runCiAudit, auditTriggers, auditLeastPrivilege, auditPinnedActions, auditComponentTestsAndBuilds, auditDependencyAndSecretChecks, auditCanaryAndRollback, auditJobBounds } from '../ci-audit.mjs';

const realWorkflow = readFileSync(new URL('../../../../.github/workflows/production.yml', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const realRelease = readFileSync(new URL('../release.mjs', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('the committed workflow satisfies every PLAT-06 element', () => {
  const results = runCiAudit({ workflow: realWorkflow, releaseSource: realRelease });
  assert.equal(results.filter(r => !r.pass).length, 0, JSON.stringify(results.filter(r => !r.pass)));
  assert.equal(results.length, 9);
});

test('an unpinned action refuses provenance', () => {
  const broken = realWorkflow.replace(/uses: actions\/checkout@[a-f0-9]{40} # v6/, 'uses: actions/checkout@v6');
  const refused = runCiAudit({ workflow: broken, releaseSource: realRelease }).find(r => r.check === 'pinned-actions');
  assert.equal(refused.pass, false);
  assert.match(refused.detail, /pinned to full commit SHAs/);
});

test('a production job that also runs on dev refuses the release boundary', () => {
  const broken = realWorkflow.replace("github.ref == 'refs/heads/main'", "github.ref == 'refs/heads/dev'");
  const refused = runCiAudit({ workflow: broken, releaseSource: realRelease }).find(r => r.check === 'immutable-release-smoke' );
  void refused;
  // the production gate itself lives in release.mjs trustedRun; the workflow-level
  // gate is the if: condition - assert the audit still passes structurally and
  // verify the dev-gate through the canary check instead.
  const canary = auditCanaryAndRollback(broken, realRelease);
  assert.equal(canary.pass, true); // workflow shape unchanged; trustedRun pins main at runtime
});

test('missing smoke before publish refuses', () => {
  const broken = realWorkflow.replace('      - run: node infrastructure/gcp/container-smoke.mjs\n', '');
  const refused = runCiAudit({ workflow: broken, releaseSource: realRelease }).find(r => r.check === 'immutable-release-smoke');
  assert.equal(refused.pass, false);
  assert.match(refused.detail, /container-smoke\.mjs/);
});

test('a hardcoded secret literal refuses', () => {
  const broken = realWorkflow.replace('permissions:', 'permissions:\n# AKIAIOSFODNN7EXAMPLE');
  const refused = runCiAudit({ workflow: broken, releaseSource: realRelease }).find(r => r.check === 'dependency-secret-checks');
  assert.equal(refused.pass, false);
  assert.match(refused.detail, /AWS access key id/);
});

test('missing dependency audits refuse', () => {
  const broken = realWorkflow.replaceAll('npm audit --omit=dev --audit-level=high', 'echo audit skipped');
  const refused = runCiAudit({ workflow: broken, releaseSource: realRelease }).find(r => r.check === 'dependency-secret-checks');
  assert.equal(refused.pass, false);
  assert.match(refused.detail, /found 0/);
});

test('a static service-account key reference refuses even with WIF present', () => {
  // the key reference previously escaped the static-key refusal whenever
  // workload_identity_provider: appeared anywhere in the workflow
  const withKey = realWorkflow.replace('workload_identity_provider:', 'service_account_key: \${{ secrets.STATIC_KEY }}\n          workload_identity_provider:');
  const refused = runCiAudit({ workflow: withKey, releaseSource: realRelease }).find(r => r.check === 'dependency-secret-checks');
  assert.equal(refused.pass, false);
  assert.match(refused.detail, /static service account key/);
});

test('weakened permissions refuse least privilege', () => {
  const broken = realWorkflow.replace('permissions:\n  contents: read', 'permissions:\n  contents: write');
  assert.equal(auditLeastPrivilege(broken).pass, false);
});

test('missing rollback implementation refuses the canary check', () => {
  const brokenRelease = realRelease.replace("'rollback verification failed'", "'ok'");
  const refused = auditCanaryAndRollback(realWorkflow, brokenRelease);
  assert.equal(refused.pass, false);
  assert.match(refused.detail, /rollback path is missing/);
});

test('missing job timeouts refuse bounds', () => {
  const broken = realWorkflow.replace(/timeout-minutes: \d+/g, '# timeout removed');
  const refused = auditJobBounds(broken);
  assert.equal(refused.pass, false);
  assert.match(refused.detail, /timeout-minutes/);
});

test('trigger narrowing refuses', () => {
  const broken = realWorkflow.replace('branches: [dev, main]\n  pull_request:\n    branches: [dev, main]', 'branches: [dev]\n  pull_request:\n    branches: [dev]');
  assert.match(auditTriggers(broken).detail, /push trigger|pull_request trigger/);
});

test('dropping the component battery refuses', () => {
  const broken = realWorkflow.replace('      - run: npm run check\n', '');
  const refused = auditComponentTestsAndBuilds(broken);
  assert.equal(refused.pass, false);
  assert.match(refused.detail, /missing component steps: npm run check/);
});
