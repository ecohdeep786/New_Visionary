import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const python = process.platform === 'win32' ? 'python' : 'python3';
const run = args => JSON.parse(execFileSync(python, ['product_env.py', ...args], { cwd: root, encoding: 'utf8', timeout: 10000 }));

test('offline plan declares actual command projection, source hashes and private bounded resources', () => {
  const plan = run(['plan']), c = plan.configuration;
  assert.equal(c.project, 'visionary-research'); assert.equal(c.projectNumber, '174851137514');
  assert.equal(c.sql.publicIp, false); assert.equal(c.sql.sslMode, 'ENCRYPTED_ONLY');
  assert.equal(c.sql.pointInTimeRecoveryEnabled, true); assert.equal(c.bucket.versioning, true);
  assert.equal(c.queue.maxConcurrentDispatches, 10); assert.equal(c.queue.maxAttempts, 5);
  assert.equal(c.queue.deliveryConfigured, false);
  assert.match(plan.planSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(plan.sourceSha256).sort(), ['bootstrap.py', 'product_env.py']);
  const sql = plan.commands.data.resources.find(r => r.key === 'sql');
  assert.ok(sql.createOnlyIfMissing[0].includes('--ssl-mode=ENCRYPTED_ONLY'));
  assert.ok(plan.commands.storage.resources[0].createOnlyIfMissing[1].includes('--versioning'));
  assert.ok(plan.commands.protection.resources[0].createOnlyIfMissing[2].includes('--src-ip-ranges=*'));
  assert.equal(run(['plan']).planSha256, plan.planSha256);
});

test('staging requires a separate explicit project and binds every identity/name to it', () => {
  const stage = run(['plan', '--environment=staging', '--project=visionary-staging-check', '--project-number=111222333444']);
  assert.equal(stage.configuration.project, 'visionary-staging-check');
  assert.equal(stage.configuration.foundation.domain, null);
  assert.equal(JSON.stringify(stage).includes('visionary-research'), false);
});

test('unknown modes and unapproved applies fail before SDK invocation', () => {
  for (const [args, message] of [[['apply-everything'], /invalid choice/], [['apply-queue'], /EXPLICIT_APPLY_TARGET_REQUIRED/],
    [['apply-queue', '--environment=production', '--project=visionary-research', '--project-number=174851137514'], /EXACT_PLAN_APPROVAL_REQUIRED/]]) {
    const result = spawnSync(python, ['product_env.py', ...args], { cwd: root, encoding: 'utf8', timeout: 10000 });
    assert.notEqual(result.status, 0); assert.match(result.stderr, message);
  }
});
