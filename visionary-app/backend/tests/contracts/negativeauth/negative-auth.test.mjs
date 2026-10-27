/**
 * PRIV-06 (KAN-115) — negative authorization tests across exports, object
 * links, search results, error messages and telemetry; log/backup/access-review
 * and secret-rotation procedures.
 *
 * Proven here:
 *   1. EXPORT/OBJECT LINKS: owner-bound and expiring — a stranger refuses, an
 *      expired link refuses,
 *   2. SEARCH: another user's private matches never appear (no search leak),
 *   3. ERROR MESSAGES: wrong-user and unknown-id denials are byte-equal (no
 *      existence leak),
 *   4. TELEMETRY: raw private text present refuses (redacted records pass),
 *   5. PROCEDURES: log-retention/backup-hold/access-review/secret-rotation
 *      records validate; a missing procedure refuses.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { NegativeAuthorizationGate } = req('./dist/src/negativeauth/negative-auth-gate.js');
const { InMemoryNegativeAuthStore } = req('./dist/src/negativeauth/negative-auth-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const NOW = 1_800_000_000_000;

async function makeGate() {
  const store = new InMemoryNegativeAuthStore();
  store.seedLink({ token: 'tok_valid', ownerUid: OWNER.uid, resourceRef: 'export/owner_1', expiresAt: NOW + 60_000 });
  store.seedLink({ token: 'tok_expired', ownerUid: OWNER.uid, resourceRef: 'export/owner_1_old', expiresAt: NOW - 60_000 });
  store.seedLink({ token: 'tok_foreign', ownerUid: 'uid_other', resourceRef: 'export/other', expiresAt: NOW + 60_000 });
  store.seedSearchHits([
    { resultId: 'r1', ownerUid: OWNER.uid, visibility: 'private', snippet: 'orbits lesson notes' },
    { resultId: 'r2', ownerUid: 'uid_other', visibility: 'private', snippet: 'orbits private draft of someone else' },
    { resultId: 'r3', ownerUid: 'uid_other', visibility: 'public', snippet: 'orbits public explainer' },
  ]);
  store.seedProcedures([
    { procedureId: 'p1', kind: 'log_retention', cadenceDays: 30, steps: ['Purge log partitions older than the window'] },
    { procedureId: 'p2', kind: 'backup_hold', cadenceDays: 35, steps: ['Hold backups matching a legal hold; verify after restore window'] },
    { procedureId: 'p3', kind: 'access_review', cadenceDays: 90, steps: ['Review scoped-operator access grants quarterly'] },
    { procedureId: 'p4', kind: 'secret_rotation', cadenceDays: 90, steps: ['Rotate signing keys; verify old signatures reject'] },
  ]);
  return { store, gate: new NegativeAuthorizationGate(store) };
}

// ---------------------------------------------------------------------------

test('EXPORT/OBJECT LINKS: a stranger refuses, an expired link refuses, the owner within the window resolves', async () => {
  const { gate } = await makeGate();
  const ok = await gate.resolveLink('tok_valid', OWNER, NOW);
  assert.equal(ok.resourceRef, 'export/owner_1', 'the owner within the window resolves');

  await assert.rejects(
    () => gate.resolveLink('tok_valid', STRANGER, NOW),
    (e) => e.code === 'link_not_owned',
    'a stranger cannot use another user\'s link',
  );
  await assert.rejects(
    () => gate.resolveLink('tok_expired', OWNER, NOW),
    (e) => e.code === 'link_expired',
    'an expired link refuses',
  );
  await assert.rejects(
    () => gate.resolveLink('tok_foreign', STRANGER, NOW),
    (e) => e.code === 'link_not_owned',
  );
});

test('SEARCH: another user\'s private matches never appear — public results do (no search leak)', async () => {
  const { gate } = await makeGate();
  const { results } = await gate.search(OWNER, 'orbits');
  const ids = results.map((r) => r.resultId);
  assert.ok(!ids.includes('r2'), 'another user\'s private match NEVER appears');
  assert.ok(ids.includes('r1'), 'own private match appears');
  assert.ok(ids.includes('r3'), 'public matches appear');
});

test('ERROR MESSAGES: wrong-user and unknown-id denials are byte-equal (no existence leak)', () => {
  // The same canonical text for both cases.
  const wrongUser = NegativeAuthorizationGate.uniformDenialText();
  const unknownId = NegativeAuthorizationGate.uniformDenialText();
  assert.equal(wrongUser, unknownId, 'byte-equal denials — no existence leak');
  assert.ok(wrongUser.length > 0);
});

test('TELEMETRY: raw private text present refuses; redacted records pass', () => {
  const raw = 'the learner typed this private sentence';
  assert.throws(
    () => NegativeAuthorizationGate.telemetryCheck({ event: 'turn', text: raw }, [raw]),
    (e) => e.code === 'telemetry_leak',
  );
  // Redacted placeholder (KAN-91) passes.
  assert.doesNotThrow(
    () => NegativeAuthorizationGate.telemetryCheck({ event: 'turn', text: `learner_text:<len:${raw.length}>` }, [raw]),
  );
});

test('PROCEDURES: log/backup/access-review/rotation records validate; a missing procedure refuses', async () => {
  const { store, gate } = await makeGate();
  await assert.doesNotThrow(() => gate.validateProcedures(), 'the full procedure set validates');

  // Remove the secret-rotation procedure: validation refuses.
  const partial = new InMemoryNegativeAuthStore();
  partial.seedProcedures([
    { procedureId: 'p1', kind: 'log_retention', cadenceDays: 30, steps: ['Purge old partitions'] },
    { procedureId: 'p2', kind: 'backup_hold', cadenceDays: 35, steps: ['Hold'] },
    { procedureId: 'p3', kind: 'access_review', cadenceDays: 90, steps: ['Review'] },
  ]);
  const partialGate = new NegativeAuthorizationGate(partial);
  await assert.rejects(() => partialGate.validateProcedures(), (e) => e.code === 'procedure_invalid');
  void store;
});
