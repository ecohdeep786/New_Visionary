/**
 * AI-07 (KAN-89) — atomic usage reservation, bounded context/tokens/tool
 * loops/attempts, measured usage ledger, terminal settlement and
 * ambiguous-timeout reconciliation without duplicate user debit.
 *
 * Proven here:
 *   1. reservation is ATOMIC: over-quota refuses; two concurrent reservations
 *      of the last unit — exactly one succeeds,
 *   2. bounds enforced BEFORE any spend: tokens/tool loops/attempts refuse
 *      with bound_exceeded,
 *   3. settlement is TERMINAL and idempotent: an ambiguous-timeout retry of the
 *      same settle converges to `duplicate` and NEVER debits twice,
 *   4. the ledger is MEASURED and append-only (reserved/settled/released with
 *      exact amounts),
 *   5. no cross-user leakage: another user's quota/reservations are untouched,
 *   6. wrong-user and unknown-reservation settles fail closed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { UsageReservationService } = req('./dist/src/usagereservation/usage-reservation.js');
const { InMemoryUsageStore } = req('./dist/src/usagereservation/usage-reservation-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const BOUNDS = { maxTokens: 1000, maxToolLoops: 3, maxAttempts: 5 };

async function makeService(quota = 1000) {
  const store = new InMemoryUsageStore();
  store.seedQuota(OWNER, quota);
  store.seedQuota(OTHER, 1000);
  return { store, svc: new UsageReservationService(store) };
}

test('reservation is ATOMIC: over-quota refuses; two concurrent reservations of the last unit — exactly one succeeds', async () => {
  const { store, svc } = await makeService(100);
  const r1 = await svc.reserve(OWNER, 60, BOUNDS);
  assert.equal(r1.reservedTokens, 60);
  assert.equal(store.balanceOf(OWNER), 40);

  // Exactly the remaining balance: this one succeeds.
  const r2 = await svc.reserve(OWNER, 40, BOUNDS);
  assert.equal(r2.reservedTokens, 40);
  assert.equal(store.balanceOf(OWNER), 0);

  // Over quota now: refused.
  await assert.rejects(() => svc.reserve(OWNER, 1, BOUNDS), (e) => e.code === 'insufficient_quota');

  // Concurrency: two reservations racing for the same last unit — from two
  // service instances over the same store (as two requests would).
  const store2 = new InMemoryUsageStore();
  store2.seedQuota(OWNER, 10);
  const svcA = new UsageReservationService(store2);
  const svcB = new UsageReservationService(store2);
  const [a, b] = await Promise.allSettled([svcA.reserve(OWNER, 10, BOUNDS), svcB.reserve(OWNER, 10, BOUNDS)]);
  const granted = [a, b].filter((r) => r.status === 'fulfilled');
  const refused = [a, b].filter((r) => r.status === 'rejected' && r.reason.code === 'insufficient_quota');
  assert.equal(granted.length, 1, 'exactly one reservation wins the last unit');
  assert.equal(refused.length, 1, 'the loser is refused with insufficient_quota');
  assert.equal(store2.balanceOf(OWNER), 0, 'no double deduction');
});

test('bounds enforced BEFORE any spend: tokens, tool loops, attempts refuse with bound_exceeded', async () => {
  const { store, svc } = await makeService();
  await assert.rejects(() => svc.reserve(OWNER, 1001, BOUNDS), (e) => e.code === 'bound_exceeded');
  assert.equal(store.balanceOf(OWNER), 1000, 'no spend happened on a bound refusal');

  // Tool loops and attempts are capped; the Nth+1 use refuses.
  for (let i = 0; i < BOUNDS.maxToolLoops; i++) svc.ensureWithinBound('toolLoop', i, BOUNDS);
  assert.throws(() => svc.ensureWithinBound('toolLoop', BOUNDS.maxToolLoops, BOUNDS), (e) => e.code === 'bound_exceeded');
  for (let i = 0; i < BOUNDS.maxAttempts; i++) svc.ensureWithinBound('attempt', i, BOUNDS);
  assert.throws(() => svc.ensureWithinBound('attempt', BOUNDS.maxAttempts, BOUNDS), (e) => e.code === 'bound_exceeded');
});

test('settlement is TERMINAL and idempotent: an ambiguous-timeout retry NEVER debits twice', async () => {
  const { store, svc } = await makeService(1000);
  const reservation = await svc.reserve(OWNER, 500, BOUNDS);
  assert.equal(store.balanceOf(OWNER), 500);

  // The settle call times out ambiguously after applying; the client retries
  // the SAME settle.
  const first = await svc.settle(OWNER, reservation.reservationId, 320);
  assert.deepEqual(first, { outcome: 'settled', usedTokens: 320, releasedTokens: 180 });
  assert.equal(store.balanceOf(OWNER), 680, '500 reserved − 320 used + 180 released');

  // The retry: converges to duplicate with NO second debit.
  const retry = await svc.settle(OWNER, reservation.reservationId, 320);
  assert.equal(retry.outcome, 'duplicate');
  assert.equal(store.balanceOf(OWNER), 680, 'balance unchanged by the retry — no duplicate user debit');
});

test('the ledger is MEASURED and append-only: reserved/settled/released entries with exact amounts', async () => {
  const { store, svc } = await makeService(1000);
  const reservation = await svc.reserve(OWNER, 500, BOUNDS);
  await svc.settle(OWNER, reservation.reservationId, 320);

  const ledger = await store.ledgerFor(OWNER);
  assert.deepEqual(ledger.map((e) => `${e.kind}:${e.amountTokens}`), ['reserved:500', 'settled:320', 'released:180'], 'measured amounts verbatim');
  const snapshot = JSON.stringify(ledger);

  const r2 = await svc.reserve(OWNER, 100, BOUNDS);
  await svc.settle(OWNER, r2.reservationId, 100);
  const ledger2 = await store.ledgerFor(OWNER);
  assert.equal(JSON.stringify(ledger2.slice(0, 3)), snapshot, 'earlier entries byte-stable (append-only)');
});

test('no cross-user leakage: another user\'s quota and ledger are untouched by this owner\'s activity', async () => {
  const { store, svc } = await makeService(1000);
  const reservation = await svc.reserve(OWNER, 400, BOUNDS);
  await svc.settle(OWNER, reservation.reservationId, 100);

  assert.equal(store.balanceOf(OTHER), 1000, 'other user quota untouched');
  const otherLedger = await store.ledgerFor(OTHER);
  assert.equal(otherLedger.length, 0, 'other user ledger untouched');
});

test('wrong-user and unknown-reservation settles fail closed; unused reservations release fully', async () => {
  const { store, svc } = await makeService(1000);
  const reservation = await svc.reserve(OWNER, 300, BOUNDS);

  const stranger = await svc.settle(OTHER, reservation.reservationId, 100);
  assert.equal(stranger.ok, false);
  assert.equal(stranger.reason, 'not_owner');

  const unknown = await svc.settle(OWNER, 'res_ghost', 100);
  assert.equal(unknown.ok, false);
  assert.equal(unknown.reason, 'unknown_reservation');

  // Fully unused reservation: settle with zero measured usage releases everything.
  const unused = await svc.settle(OWNER, reservation.reservationId, 0);
  assert.deepEqual(unused, { outcome: 'settled', usedTokens: 0, releasedTokens: 300 });
  assert.equal(store.balanceOf(OWNER), 1000, 'the full reservation was released without charge');
});
