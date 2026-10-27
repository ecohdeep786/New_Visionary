/**
 * PRIV-05 (KAN-114) — support cases/reporting, scoped operator access,
 * reason/audit and incident/abuse response. No unrestricted user dump or
 * default open access.
 *
 * Proven here:
 *   1. case filing: owner-scoped with an explicit reason; an empty reason
 *      refuses; abuse/content reports open an incident that RESTRICTS the
 *      content pending review,
 *   2. scoped operator access: WITHOUT the support.review scope (or without an
 *      operator identity) access refuses; WITH it, access is per-case,
 *      reason-required, and every access appends the audit (who/case/why/when),
 *   3. NO unrestricted dump: a whole-user data dump refuses for ANY operator,
 *      ANY reason,
 *   4. audit is append-only: earlier entries stay byte-stable,
 *   5. incident resolution records the outcome, closes the case, and audits,
 *   6. wrong users denied on own-case inspection; unknown cases fail closed.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { SupportCaseService } = req('./dist/src/supportcases/support-case-service.js');
const { InMemorySupportCaseStore } = req('./dist/src/supportcases/support-case-lookups.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const OPERATOR = { operatorId: 'op_support_1', scopes: ['support.review'] };

async function makeService() {
  const store = new InMemorySupportCaseStore();
  return { store, svc: new SupportCaseService(store) };
}

// ---------------------------------------------------------------------------

test('case filing: owner-scoped with explicit reason; empty reason refuses; abuse reports open a RESTRICTING incident', async () => {
  const { svc } = await makeService();
  const support = await svc.fileCase(OWNER, 'support', 'Cannot resume my lesson on another device');
  assert.equal(support.status, 'open');
  assert.equal(support.incidentId, null, 'a plain support case opens no incident');

  await assert.rejects(
    () => svc.fileCase(OWNER, 'support', '   '),
    (e) => e.code === 'reason_required',
  );

  const abuse = await svc.fileCase(OWNER, 'abuse_report', 'Inappropriate content in a shared project', 'content:proj_9');
  assert.equal(abuse.status, 'restricted', 'the abuse response RESTRICTS pending review');
  assert.ok(abuse.incidentId, 'an incident opened');
  const incident = await svc.inspectOwn(abuse.caseId, OWNER);
  assert.ok(incident.incidentId);
});

test('scoped operator access: without the scope (or operator identity) access refuses; with it, per-case reason-required audited access', async () => {
  const { store, svc } = await makeService();
  const support = await svc.fileCase(OWNER, 'support', 'Need help with billing receipt');
  const caseId = support.caseId;

  // Ordinary user identity is never an operator.
  await assert.rejects(
    () => svc.operatorAccess({ operatorId: 'uid_regular', scopes: [], caseId, reason: 'curious' }),
    (e) => e.code === 'operator_scope_required',
  );
  // Operator without the scope refuses.
  await assert.rejects(
    () => svc.operatorAccess({ operatorId: 'op_2', scopes: ['other.scope'], caseId, reason: 'x' }),
    (e) => e.code === 'operator_scope_required',
  );
  // Access without a reason refuses.
  await assert.rejects(
    () => svc.operatorAccess({ operatorId: 'op_support_1', scopes: ['support.review'], caseId, reason: ' ' }),
    (e) => e.code === 'reason_required',
  );

  // Scoped operator WITH a reason: access granted AND audited.
  const accessed = await svc.operatorAccess({ operatorId: 'op_support_1', scopes: ['support.review'], caseId, reason: 'Resolving the receipt request' });
  assert.equal(accessed.caseId, caseId);
  const trail = await svc.auditTrail(caseId, { scopes: ['support.review'] });
  assert.equal(trail.entries.length, 1);
  assert.equal(trail.entries[0].operatorId, 'op_support_1');
  assert.equal(trail.entries[0].reason, 'Resolving the receipt request');
  void store;
});

test('NO unrestricted dump: a whole-user data dump refuses for ANY operator, ANY reason', async () => {
  const { svc } = await makeService();
  await assert.rejects(
    () => svc.operatorDump('op_support_1', ['support.review'], OWNER.uid, 'support investigation'),
    (e) => e.code === 'operator_dump_refused',
    'per-case access only — never a bulk user dump',
  );
  await assert.rejects(
    () => svc.operatorDump('op_support_1', ['support.review', 'admin'], OWNER.uid, 'even with more scopes'),
    (e) => e.code === 'operator_dump_refused',
  );
});

test('audit is append-only: earlier entries stay byte-stable after later accesses', async () => {
  const { store, svc } = await makeService();
  const support = await svc.fileCase(OWNER, 'account_issue', 'Two devices conflict');
  await svc.operatorAccess({ operatorId: 'op_support_1', scopes: ['support.review'], caseId: support.caseId, reason: 'first look' });
  const snapshot = JSON.stringify(await store.auditFor(support.caseId));

  await svc.operatorAccess({ operatorId: 'op_support_1', scopes: ['support.review'], caseId: support.caseId, reason: 'follow-up' });
  const after = await store.auditFor(support.caseId);
  assert.equal(after.length, 2, 'append-only growth');
  assert.equal(JSON.stringify(after.slice(0, 1)), snapshot, 'earlier entries byte-stable');
});

test('incident resolution records the outcome, closes the case, and audits the decision', async () => {
  const { store, svc } = await makeService();
  const abuse = await svc.fileCase(OWNER, 'content_report', 'Reported project content', 'content:proj_9');

  const resolved = await svc.resolveIncident({
    operatorId: 'op_support_1', scopes: ['support.review'],
    incidentId: abuse.incidentId, outcome: 'action_taken', reason: 'Content removed after review',
  });
  assert.equal(resolved.outcome, 'action_taken');
  assert.equal(resolved.resolvedBy, 'op_support_1');

  await assert.rejects(
    () => svc.resolveIncident({ operatorId: 'op_support_1', scopes: ['support.review'], incidentId: abuse.incidentId, outcome: 'no_action', reason: 'again' }),
    (e) => e.code === 'already_resolved',
  );
  const closed = await svc.inspectOwn(abuse.caseId, OWNER);
  assert.equal(closed.status, 'resolved', 'the case closed honestly');
  const trail = await svc.auditTrail(abuse.caseId, { scopes: ['support.review'] });
  assert.ok(trail.entries.some((e) => e.reason.includes('incident')), 'the resolution is audited');
  void store;
});

test('wrong users denied on own-case inspection; unknown cases fail closed', async () => {
  const { svc } = await makeService();
  const support = await svc.fileCase(OWNER, 'support', 'My case');
  await assert.rejects(
    () => svc.inspectOwn(support.caseId, { uid: 'uid_stranger', workspaceId: 'ws_personal' }),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(() => svc.inspectOwn('case_ghost', OWNER), (e) => e.code === 'unknown_case');
  await assert.rejects(
    () => svc.operatorAccess({ operatorId: 'op_support_1', scopes: ['support.review'], caseId: 'case_ghost', reason: 'x' }),
    (e) => e.code === 'unknown_case',
  );
});
