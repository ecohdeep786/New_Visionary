/**
 * BUILD-04 (KAN-78) — durable run/status/event and proposal accept/reject
 * contracts. AI proposals are bound to a base revision; new edits or revoked
 * permission block acceptance.
 *
 * Proven here:
 *   1. runs are durable: status transitions append immutable events; status is
 *      derived (never mutated in place),
 *   2. AI proposals bind to the exact base revision; a cancelled run yields no
 *      proposals,
 *   3. NEW EDITS block acceptance (base revision moved),
 *   4. REVOKED PERMISSION blocks acceptance,
 *   5. acceptance appends a new revision; rejection records without history;
 *      decisions are idempotent per decision id,
 *   6. wrong users denied; unknown runs/proposals fail closed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { RunContractService } = req('./dist/src/runs/run-contract-service.js');
const { InMemoryRunContractStore } = req('./dist/src/runs/run-contract-lookups.js');

const OWNER = { uid: 'uid_builder_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const PROJECT = 'prj_solar';

async function makeService() {
  const store = new InMemoryRunContractStore();
  const svc = new RunContractService(store);
  const run = await svc.startRun(OWNER, PROJECT, 0);
  return { store, svc, run };
}

// ---------------------------------------------------------------------------

test('runs are durable: transitions append immutable events and status is derived, never mutated in place', async () => {
  const { store, svc, run } = await makeService();
  assert.equal(run.status, 'queued');
  const running = await svc.transition(run.runId, OWNER, 'running', 'generating proposal');
  assert.equal(running.status, 'running');
  assert.equal(running.events.length, 2);
  const eventsBefore = JSON.stringify(running.events);

  const succeeded = await svc.transition(run.runId, OWNER, 'succeeded', 'proposal ready');
  assert.equal(succeeded.status, 'succeeded');
  assert.equal(succeeded.events.length, 3);
  assert.equal(JSON.stringify(succeeded.events.slice(0, 2)), eventsBefore, 'earlier events immutable');

  const stored = await store.byRunId(run.runId);
  assert.equal(stored.status, 'succeeded', 'status derived from the latest event');
});

test('AI proposals bind to the exact base revision; a cancelled run yields no proposals', async () => {
  const { svc, run } = await makeService();
  const proposal = await svc.propose(run.runId, OWNER, { suggestion: 'add Saturn rings slide' });
  assert.equal(proposal.baseRevision, run.baseRevision, 'proposal bound to the base revision');
  assert.equal(proposal.status, 'pending');

  const run2 = await svc.startRun(OWNER, PROJECT, 0);
  await svc.transition(run2.runId, OWNER, 'cancelled', 'user cancelled');
  await assert.rejects(
    () => svc.propose(run2.runId, OWNER, { x: 1 }),
    (e) => e.code === 'cancelled_run_no_proposal',
    'a cancelled run yields no proposals',
  );
});

test('NEW EDITS block acceptance: base revision moved since the proposal was generated', async () => {
  const { store, svc, run } = await makeService();
  const proposal = await svc.propose(run.runId, OWNER, { suggestion: 'auto-layout' });

  // A new edit lands after the proposal: current revision 0 -> 1.
  await store.appendRevision(PROJECT, { edit: 'manual change' });

  await assert.rejects(
    () => svc.acceptProposal({ owner: OWNER, proposalId: proposal.proposalId, decisionId: 'd1' }),
    (e) => e.code === 'base_revision_moved',
    'new edits block acceptance',
  );
});

test('REVOKED PERMISSION blocks acceptance', async () => {
  const { store, svc, run } = await makeService();
  const proposal = await svc.propose(run.runId, OWNER, { suggestion: 'auto-layout' });
  store.revokePermission(OWNER.uid, PROJECT);

  await assert.rejects(
    () => svc.acceptProposal({ owner: OWNER, proposalId: proposal.proposalId, decisionId: 'd1' }),
    (e) => e.code === 'permission_revoked',
    'revoked permission blocks acceptance',
  );
});

test('acceptance appends a new revision; rejection records without history; decisions idempotent per decision id', async () => {
  const { store, svc, run } = await makeService();
  const p1 = await svc.propose(run.runId, OWNER, { suggestion: 'auto-layout' });
  const accepted = await svc.acceptProposal({ owner: OWNER, proposalId: p1.proposalId, decisionId: 'dec_1' });
  assert.equal(accepted.outcome, 'committed');
  assert.equal(accepted.newRevisionNo, 1, 'acceptance applied as a NEW revision');

  // Idempotent replay of the same decision.
  const replay = await svc.acceptProposal({ owner: OWNER, proposalId: p1.proposalId, decisionId: 'dec_1' });
  assert.equal(replay.outcome, 'duplicate');
  assert.equal(await store.currentRevision(PROJECT), 1, 'no double-append');

  // Rejection records the decision; history untouched.
  const p2 = await svc.propose(run.runId, OWNER, { suggestion: 'drop everything' });
  const rejected = await svc.rejectProposal({ owner: OWNER, proposalId: p2.proposalId, decisionId: 'dec_2', reason: 'not wanted' });
  assert.equal(rejected.outcome, 'committed');
  const rejectedReplay = await svc.rejectProposal({ owner: OWNER, proposalId: p2.proposalId, decisionId: 'dec_2', reason: 'x' });
  assert.equal(rejectedReplay.outcome, 'duplicate');
  assert.equal(await store.currentRevision(PROJECT), 1, 'rejection touched no history');
  const proposal2 = await store.byProposalId(p2.proposalId);
  assert.equal(proposal2.status, 'rejected');
});

test('wrong users denied; unknown runs/proposals fail closed', async () => {
  const { svc, run } = await makeService();
  await assert.rejects(() => svc.transition(run.runId, OTHER, 'running', 'x'), (e) => e.code === 'not_owner');
  await assert.rejects(() => svc.propose(run.runId, OTHER, {}), (e) => e.code === 'not_owner');
  await assert.rejects(() => svc.startRun(OWNER, 'prj_ghost', 0).then(() => svc.propose('run_ghost', OWNER, {})), (e) => e.code === 'unknown_run');
  await assert.rejects(
    () => svc.acceptProposal({ owner: OWNER, proposalId: 'prp_ghost', decisionId: 'd9' }),
    (e) => e.code === 'unknown_proposal',
  );
});
