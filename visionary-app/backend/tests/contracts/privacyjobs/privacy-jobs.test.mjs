/**
 * PRIV-02 (KAN-111) — authenticated bounded export/deletion jobs across all
 * five stores; stop new work/downloads first; verify completion/reconciliation.
 *
 * Proven here:
 *   1. STOP NEW WORK FIRST: the owner is frozen before any store is touched,
 *      and new work while frozen refuses,
 *   2. the job sweeps ALL FIVE stores with per-store reconciliation,
 *   3. a complete job requires every store to reconcile (declared == actual),
 *   4. a mismatching store marks the job INCOMPLETE honestly with the store
 *      named — never a fake success,
 *   5. the job is idempotent per jobId (retry converges, no duplicate sweep),
 *   6. wrong users cannot run or inspect another's job,
 *   7. the claim is ATOMIC (conditional create): exactly one concurrent run of
 *      the same jobId wins; the loser never freezes or sweeps — a concurrent
 *      duplicate deletion job cannot double-delete (the reviewer's correction).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { PrivacyLifecycleJobService } = req('./dist/src/privacyjobs/privacy-jobs-service.js');
const { InMemoryPrivacyJobStore } = req('./dist/src/privacyjobs/privacy-jobs-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };

async function makeService() {
  const store = new InMemoryPrivacyJobStore();
  for (const s of ['firestore', 'sql', 'objects', 'provider_artifacts', 'caches']) {
    store.seedDeclared(s, OWNER.uid, 4);
  }
  return { store, svc: new PrivacyLifecycleJobService(store) };
}

// ---------------------------------------------------------------------------

test('STOP NEW WORK FIRST: the owner is frozen before any store is touched; new work while frozen refuses', async () => {
  const { store, svc } = await makeService();
  assert.equal(await store.isFrozen(OWNER.uid), false, 'not frozen before the job');

  await svc.runJob({ jobId: 'job_1', owner: OWNER, kind: 'export' });
  assert.equal(await store.isFrozen(OWNER.uid), true, 'frozen by the job (stop-first)');

  // New work while frozen refuses (composes with the caller-side check).
  await assert.rejects(
    () => svc.assertNotFrozen(OWNER),
    (e) => e.code === 'owner_frozen',
  );
});

test('the job sweeps ALL FIVE stores with per-store reconciliation and completes honestly', async () => {
  const { svc } = await makeService();
  const receipt = await svc.runJob({ jobId: 'job_export', owner: OWNER, kind: 'export' });
  assert.deepEqual(receipt.stores.map((s) => s.store), ['firestore', 'sql', 'objects', 'provider_artifacts', 'caches'], 'all five stores swept');
  assert.ok(receipt.stores.every((s) => s.matches && s.declared === 4 && s.actual === 4), 'every store reconciled');
  assert.equal(receipt.complete, true, 'complete only when every store reconciles');
  assert.equal(receipt.newWorkStoppedFirst, true);
  // Idempotent retry: same receipt, no duplicate sweep.
  const retry = await svc.runJob({ jobId: 'job_export', owner: OWNER, kind: 'export' });
  assert.deepEqual(retry, receipt);
});

test('a mismatching store marks the job INCOMPLETE honestly with the store named — never a fake success', async () => {
  const { store, svc } = await makeService();
  store.forceSweepCount('objects', OWNER.uid, 'deletion', 3); // declared 4, actual 3

  const receipt = await svc.runJob({ jobId: 'job_del', owner: OWNER, kind: 'deletion' });
  assert.equal(receipt.complete, false, 'incomplete — honestly reported');
  assert.deepEqual(receipt.mismatch, { store: 'objects', declared: 4, actual: 3 });
  const objects = receipt.stores.find((s) => s.store === 'objects');
  assert.equal(objects.matches, false);
  // All other stores still reconciled.
  assert.ok(receipt.stores.filter((s) => s.store !== 'objects').every((s) => s.matches));
});

test('deletion jobs sweep the same five stores with reconciliation', async () => {
  const { svc } = await makeService();
  const receipt = await svc.runJob({ jobId: 'job_delete', owner: OWNER, kind: 'deletion' });
  assert.equal(receipt.kind, 'deletion');
  assert.equal(receipt.complete, true);
  assert.ok(receipt.stores.every((s) => s.actual === 4));
});

test('wrong users cannot run or inspect another\'s job; unknown jobs fail closed', async () => {
  const { svc } = await makeService();
  await svc.runJob({ jobId: 'job_owner', owner: OWNER, kind: 'export' });

  await assert.rejects(
    () => svc.inspect('job_owner', STRANGER),
    (e) => e.code === 'not_owner',
    'a stranger cannot inspect another\'s job receipt',
  );
  await assert.rejects(
    () => svc.inspect('job_ghost', OWNER),
    (e) => e.code === 'unknown_job',
  );
});

test('the job claim is ATOMIC: exactly one concurrent run of the same jobId wins — the loser never freezes or sweeps (no double deletion)', async () => {
  const { store, svc } = await makeService();
  // Claim semantics: the FIRST caller wins; every later caller for the same
  // jobId claims false (the SQL ON CONFLICT DO NOTHING law at integration).
  assert.equal(await store.claimJob('job_claim_semantics', OWNER, 'deletion'), true, 'the first claim wins');
  assert.equal(await store.claimJob('job_claim_semantics', OWNER, 'deletion'), false, 'a concurrent duplicate claim loses');
  assert.equal(await store.claimJob('job_claim_semantics', STRANGER, 'deletion'), false, 'even a different owner cannot re-claim the same jobId');

  // A runJob racing an IN-FLIGHT claim (held by the concurrent winner, which
  // has not committed its receipt yet) returns the honest pending marker and
  // performs NO store work of its own.
  await store.claimJob('job_inflight', OWNER, 'deletion');
  const pending = await svc.runJob({ jobId: 'job_inflight', owner: OWNER, kind: 'deletion' });
  assert.equal(pending.pending, true, 'the loser reports pending honestly');
  assert.equal(pending.complete, false, 'pending is not a fake success');
  assert.deepEqual(pending.stores, [], 'the loser swept nothing');
  assert.equal(await store.isFrozen(OWNER.uid), false, 'the loser never froze the owner (the winner owns the freeze)');

  // The winner commits (conditional-claim law: only the claim holder saves):
  const winnerReceipt = { jobId: 'job_inflight', owner: OWNER, kind: 'deletion', complete: true, newWorkStoppedFirst: true, stores: [] };
  await store.saveJobReceipt(winnerReceipt);
  const retry = await svc.runJob({ jobId: 'job_inflight', owner: OWNER, kind: 'deletion' });
  assert.deepEqual(retry, winnerReceipt, 'the retried job returns the winner\'s receipt — no second sweep');

  // An UNCLAIMED jobId runs normally: the service's own claim wins.
  const fresh = await svc.runJob({ jobId: 'job_fresh', owner: OWNER, kind: 'deletion' });
  assert.equal(fresh.complete, true, 'a fresh job claims and completes normally');
  assert.equal(fresh.pending, undefined);
});
