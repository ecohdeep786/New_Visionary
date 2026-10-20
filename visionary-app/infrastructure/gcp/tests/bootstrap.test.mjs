import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
test('bootstrap plan sends only the exact candidate health path to the canary and preserves DNS', () => {
  const plan = JSON.parse(execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['bootstrap.py', 'plan'], { cwd: root, encoding: 'utf8' }));
  const matcher = plan.urlmap.pathMatchers[0];
  assert.deepEqual(matcher.routeRules[0].matchRules, [{ fullPathMatch: '/__deploy-check', ignoreCase: false }]);
  assert.equal(matcher.routeRules[0].service.endsWith('/backendServices/visionary-product-candidate'), true);
  assert.equal('routeAction' in matcher.routeRules[0], false);
  assert.equal(plan.forwardedForOverride, 'X-Forwarded-For:{client_ip_address},{server_ip_address}');
  assert.equal(plan.dnsChanged, false);
  assert.equal(plan.project, 'visionary-research');
  assert.equal(plan.projectNumber, '174851137514');
  assert.equal(plan.identity, 'visionary-github-deployer@visionary-research.iam.gserviceaccount.com');
  assert.match(plan.firstRelease, /release\.mjs baseline/);
  assert.match(plan.foundation.join(' '), /visionary-product-runtime@visionary-research/);
});
