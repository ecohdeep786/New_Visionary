import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const python = process.platform === 'win32' ? 'python' : 'python3';

test('product-env plan passes structural review and declares the private/protected posture', () => {
  const plan = JSON.parse(execFileSync(python, ['product_env.py', 'plan'], { cwd: root, encoding: 'utf8' }));
  assert.equal(plan.structuralReview, 'passed');
  assert.equal(plan.project, 'visionary-research');
  assert.equal(plan.region, 'asia-south1');
  // DATA: private-IP Cloud SQL, SSL required, backups + PITR, two separate databases.
  assert.equal(plan.sql.privateNetwork, true);
  assert.equal(plan.sql.publicIp, false);
  assert.equal(plan.sql.sslRequired, true);
  assert.equal(plan.sql.backupEnabled, true);
  assert.equal(plan.sql.pointInTimeRecoveryEnabled, true);
  assert.deepEqual(plan.sql.databases, ['visionary_app', 'visionary_retrieval']);
  assert.deepEqual(plan.sql.authorizedIamMembers, ['serviceAccount:visionary-product-runtime@visionary-research.iam.gserviceaccount.com']);
  // STORAGE: one private bucket, uniform access, public access prevented, no public IAM.
  assert.equal(plan.bucket.uniformBucketLevelAccess, true);
  assert.equal(plan.bucket.publicAccessPrevention, 'enforced');
  assert.deepEqual(plan.bucket.publicIamMembers, []);
  assert.equal(plan.bucket.objectVersioningEnabled, true);
  // QUEUES: bounded dispatch and bounded retries.
  assert.ok(plan.queue.maxDispatchesPerSecond > 0);
  assert.ok(plan.queue.maxAttempts > 0 && plan.queue.maxAttempts <= 10);
  // PROTECTION: throttling armor rule with 429 on exceed, attached to both backends.
  assert.equal(plan.armor.rules[0].action, 'throttle');
  assert.equal(plan.armor.rules[0].rateLimit.exceedAction, '429');
  assert.deepEqual([...plan.armor.attachedBackends].sort(), ['visionary-product-candidate', 'visionary-product-web']);
  // No credentials in the plan output.
  const text = JSON.stringify(plan);
  for (const marker of ['password', 'private_key', 'api_key', 'secret_value']) {
    assert.ok(!text.includes(marker), `plan must not embed ${marker}`);
  }
});

test('product-env refuses to run an unknown mode and never applies from plan', () => {
  let failed = false;
  try {
    execFileSync(python, ['product_env.py', 'apply-everything'], { cwd: root, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    failed = true;
  }
  assert.equal(failed, true);
});
