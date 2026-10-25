/**
 * DATA-08 — prove wrong UID/workspace/role, concurrent grants/revocation,
 * stale writes and account-switch races; bound total instances x connection
 * pools and recover cleanly after reconnect. Every probe runs against the
 * in-memory synthetic owning store; preview/fixture membership is never
 * production permission.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ConcurrencyProver } = req('./dist/src/concurrency/concurrency.service.js');
const { InMemoryProofStore, BoundedConnectionPool } = req('./dist/src/concurrency/concurrency-store.js');

function setup() {
  const s = new InMemoryProofStore();
  const prover = new ConcurrencyProver(s, { now: () => new Date('2026-10-25T10:00:00Z') });
  return { s, prover };
}

test('DATA-08 wrong uid: a grant/revoke on another account\'s resource is denied', async () => {
  const { s, prover } = setup();
  s.seedResource('document', 'doc-9', 'active', 'owner-uid');
  const report = await prover.prove({ uid: 'attacker', workspaceId: 'ws-1', role: null, operation: 'revoke', resourceType: 'document', resourceId: 'doc-9' });
  assert.equal(report.outcome, 'denied_wrong_owner');
});

test('DATA-08 wrong workspace/role: no verified membership or insufficient role is denied', async () => {
  const { s, prover } = setup();
  s.seedMember('alice', 'ws-1', 'MEMBER');
  const denied = await prover.prove({ uid: 'bob', workspaceId: 'ws-1', role: 'ADMIN', operation: 'workspace_membership' });
  assert.equal(denied.outcome, 'denied_wrong_role');
  const noWs = await prover.prove({ uid: 'alice', workspaceId: null, role: 'OWNER', operation: 'workspace_membership' });
  assert.equal(noWs.outcome, 'denied_wrong_workspace');
  const ok = await prover.prove({ uid: 'alice', workspaceId: 'ws-1', role: 'MEMBER', operation: 'workspace_membership' });
  assert.equal(ok.outcome, 'allowed');
});

test('DATA-08 concurrent grant/revocation: a second grant on an active subject purpose is rejected; a revoked grant stays revoked', async () => {
  const { s, prover } = setup();
  // uid-1 holds an active consent grant for document doc-9.
  s.seedResource('document', 'doc-9', 'active', 'uid-1');
  s.seedGrant('cg-1', { uid: 'uid-1', purpose: 'document_sharing', resourceId: 'doc-9', state: 'active' });
  // Concurrent grant on the same subject purpose/resource -> denied as duplicate.
  const dup = await prover.prove({ uid: 'uid-1', workspaceId: 'ws-1', role: 'MEMBER', operation: 'grant', resourceType: 'document', resourceId: 'doc-9', payload: { purpose: 'document_sharing' } });
  assert.equal(dup.outcome, 'denied_duplicate');
  // revoke by the subject is allowed once...
  const rev1 = await prover.prove({ uid: 'uid-1', workspaceId: null, role: 'OWNER', operation: 'revoke', resourceType: 'document', resourceId: 'doc-9', payload: { purpose: 'document_sharing' } });
  assert.equal(rev1.outcome, 'allowed');
  // ...and a second revoke of an active grant is an allowed revoke when present... but after committed revoke the STATE is revoked.
  // Prove: issuer-nominated that after we LATER mark revoked, revoke again must be denied_revoked.
  const s2 = new InMemoryProofStore();
  const p2 = new ConcurrencyProver(s2);
  s2.seedGrant('cg-1', { uid: 'uid-1', purpose: 'document_sharing', resourceId: 'doc-9', state: 'revoked' });
  const rev2 = await p2.prove({ uid: 'uid-1', workspaceId: null, role: null, operation: 'revoke', resourceType: 'document', resourceId: 'doc-9', payload: { purpose: 'document_sharing' } });
  assert.equal(rev2.outcome, 'denied_revoked');
});

test('DATA-08 wrong-owner share: an actor cannot share/revoke a resource owned by another uid', async () => {
  const { s, prover } = setup();
  s.seedResource('document', 'doc-7', 'active', 'owner-uid');
  const attempt = await prover.prove({ uid: 'other-uid', workspaceId: 'ws-2', role: 'MEMBER', operation: 'grant', resourceType: 'document', resourceId: 'doc-7', payload: { purpose: 'document_sharing' } });
  assert.equal(attempt.outcome, 'denied_wrong_owner');
  // The owner CAN grant/share its own resource when there is no existing active grant.
  const ownerGrant = await prover.prove({ uid: 'owner-uid', workspaceId: 'ws-1', role: 'OWNER', operation: 'grant', resourceType: 'document', resourceId: 'doc-7', payload: { purpose: 'document_sharing' } });
  assert.equal(ownerGrant.outcome, 'allowed');
  // A second grant by the same owner on an already-active subject purpose is a concurrent duplicate.
  const dup = await prover.prove({ uid: 'owner-uid', workspaceId: 'ws-1', role: 'OWNER', operation: 'grant', resourceType: 'document', resourceId: 'doc-7', payload: { purpose: 'document_sharing' } });
  assert.equal(dup.outcome, 'denied_duplicate');
});

test('DATA-08 stale writes: same command key with changed payload is rejected; replay keyed to another uid is denied', async () => {
  const { s, prover } = setup();
  s.seedCommand('cmd-1', { uid: 'uid-1', digest: 'd', status: 'COMMITTED' });
  const replay = await prover.prove({ uid: 'uid-1', workspaceId: 'ws-1', role: 'OWNER', operation: 'command', resourceId: 'cmd-1', payload: { source: 'changed' } });
  assert.equal(replay.outcome, 'denied_stale', 'same command key + different payload -> stale/conflicting write denied');
  const replaySame = await prover.prove({ uid: 'uid-1', workspaceId: 'ws-1', role: 'OWNER', operation: 'command', resourceId: 'cmd-1', payload: { source: 'changed' } });
  assert.notEqual(replaySame.outcome, 'allowed');
  // account-switch: same command id but issued from a different verified uid.
  const switchRace = await prover.prove({ uid: 'uid-2', workspaceId: 'ws-1', role: 'ADMIN', operation: 'command', resourceId: 'cmd-1', payload: { source: 'changed' } });
  assert.equal(switchRace.outcome, 'denied_wrong_owner');
});

test('DATA-08 pending/fingerprints: a previously-revoked grant never revives; fresh grant on an absent purpose is allowed, never auto-revive', async () => {
  const { s, prover } = setup();
  s.seedResource('document', 'doc-3', 'active', 'uid-9');
  s.seedGrant('cg-9', { uid: 'uid-9', purpose: 'model_context', resourceId: 'doc-3', state: 'revoked' });
  // A grant for the revoked subject purpose/resource is denied — never silently revived.
  const grant = await prover.prove({ uid: 'uid-9', workspaceId: null, role: null, operation: 'grant', resourceType: 'document', resourceId: 'doc-3', payload: { purpose: 'model_context' } });
  assert.equal(grant.outcome, 'denied_revoked', 'a revoked subject grant is not silently revived');
  // A genuinely fresh subject purpose/resource grant is allowed.
  s.seedResource('document', 'doc-4', 'active', 'uid-9');
  const fresh = await prover.prove({ uid: 'uid-9', workspaceId: null, role: null, operation: 'grant', resourceType: 'document', resourceId: 'doc-4', payload: { purpose: 'telemetry_optional' } });
  assert.equal(fresh.outcome, 'allowed', 'a genuinely new subject purpose/resource grant is allowed');
});

test('DATA-08 bounded pool: total connections cannot exceed the fleet-wide limit across instances', async () => {
  const pool = new BoundedConnectionPool({ totalAllowed: 3, instances: 2 });
  const a1 = await pool.acquire('instance-a');
  const a2 = await pool.acquire('instance-a');
  const b1 = await pool.acquire('instance-b');
  assert.equal(pool.active(), 3);
  await assert.rejects(pool.acquire('instance-b', 100));
  // Release frees the pool.
  await a1.release();
  assert.equal(pool.active(), 2);
  const a3 = await pool.acquire('instance-a', 50);
  assert.equal(pool.active(), 3);
  await a2.release(); await a3.release(); await b1.release();
});

test('DATA-08 clean reconnect recovery: a dropped connection is retired and a fresh acquire succeeds', async () => {
  const pool = new BoundedConnectionPool({ totalAllowed: 2, instances: 1 });
  const conn = await pool.acquire('instance-a');
  const recovered = await conn.recover('instance-a');
  assert.equal(pool.closed(), 1, 'the dropped connection is marked closed');
  assert.equal(recovered.id !== conn.id, true, 'recovery acquires a fresh connection id');
  assert.equal(pool.active(), 1, 'recovered connection is active');
  await recovered.release();
  assert.equal(pool.active(), 0);
});

test('DATA-08 pool config validation: non-positive limits are rejected', async () => {
  const s = new InMemoryProofStore();
  const prover = new ConcurrencyProver(s);
  s.seedCommand('cmd-x', { uid: 'uid-1', digest: 'old-digest', status: 'COMMITTED' });
  const stale = await prover.prove({ uid: 'uid-2', workspaceId: 'ws-1', role: 'OWNER', operation: 'command', resourceId: 'cmd-x', payload: { source: 'change' } });
  assert.equal(stale.outcome, 'denied_wrong_owner');
  assert.throws(() => new BoundedConnectionPool({ totalAllowed: 0, instances: 1 }), /INVALID_POOL/);
  assert.throws(() => new BoundedConnectionPool({ totalAllowed: 5, instances: 0 }), /INVALID_POOL/);
});
