/**
 * PRIV-01 (KAN-110) — approve purpose/minimization/retention by data class
 * (auth/device, learning text, source files, billing/audit, model artifacts);
 * supported age/admission/guardian flows.
 *
 * Proven here:
 *   1. the shipped policy passes every invariant and covers EXACTLY the five
 *      approved data classes (missing/orphan refuse; tampering detectable),
 *   2. access is ENFORCEABLE per class: owner classes deny strangers;
 *      operator-scoped classes deny ordinary users; system classes deny all
 *      interactive actors,
 *   3. minimization is enforced: a forbidden field refuses (fail closed),
 *   4. erasure is EVENT-DRIVEN and covers derived state: revoke + delete
 *      immediately; legal-minimum classes reported honestly as retained,
 *   5. model artifacts refuse raw private text,
 *   6. age/admission/guardian flows are explicit: under-age without guardian
 *      consent refuses; with active guardian consent permitted.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { PrivacyCoreService } = req('./dist/src/privacycore/privacy-core-service.js');
const { InMemoryPrivacyStore } = req('./dist/src/privacycore/privacy-core-lookups.js');
const { shippedPrivacyPolicy, validatePrivacyPolicy } = req('./dist/src/privacycore/privacy-policy.js');

const OWNER = { uid: 'uid_learner_1', workspaceId: 'ws_personal' };
const STRANGER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };

async function makeService() {
  const store = new InMemoryPrivacyStore();
  store.seedOwnership('learning_text', OWNER.uid, OWNER.workspaceId);
  store.seedOwnership('source_files', OWNER.uid, OWNER.workspaceId);
  return { store, svc: new PrivacyCoreService(store) };
}

// ---------------------------------------------------------------------------

test('the shipped policy passes every invariant and covers EXACTLY the five approved data classes; tampering detectable', () => {
  const policy = shippedPrivacyPolicy();
  assert.doesNotThrow(() => validatePrivacyPolicy(policy));
  assert.equal(policy.classes.length, 5);
  const classes = new Set(policy.classes.map((c) => c.dataClass));
  for (const c of ['auth_device', 'learning_text', 'source_files', 'billing_audit', 'model_artifacts']) {
    assert.ok(classes.has(c), `${c} covered`);
  }
  // Every retention is explicit and justified; no invented deletion TTL.
  for (const c of policy.classes) {
    assert.ok(c.retention.justification.length > 0, `${c.dataClass} retention justified`);
    assert.ok(c.retention.days >= 0);
  }
  // Tampered policy: a missing class or an orphan refuses.
  const missing = { policyVersion: 'x', classes: policy.classes.filter((c) => c.dataClass !== 'billing_audit') };
  assert.throws(() => validatePrivacyPolicy(missing), /missing class billing_audit/);
  const orphan = { policyVersion: 'x', classes: [...policy.classes, { dataClass: 'made_up_class', purpose: 'x', permittedFields: ['a'], retention: { days: 1, justification: 'x', erasureTrigger: 'owner_erasure_request' }, access: 'owner' }] };
  assert.throws(() => validatePrivacyPolicy(orphan), /orphan class made_up_class/);
});

test('access is ENFORCEABLE per class: owner classes deny strangers; operator classes deny ordinary users; system classes deny all interactive', async () => {
  const { svc } = await makeService();
  // Owner class: stranger denied, owner allowed.
  const stranger = await svc.accessCheck('learning_text', STRANGER);
  assert.equal(stranger.allowed, false);
  const owner = await svc.accessCheck('learning_text', OWNER);
  assert.equal(owner.allowed, true);

  // Operator-scoped class (billing/audit): ordinary user denied, scoped operator allowed.
  const ordinary = await svc.accessCheck('billing_audit', { uid: OWNER.uid, workspaceId: OWNER.workspaceId, scopes: [] });
  assert.equal(ordinary.allowed, false);
  const operator = await svc.accessCheck('billing_audit', { uid: 'op_1', workspaceId: 'ws_ops', scopes: ['audit.read'] });
  assert.equal(operator.allowed, true);

  // System class (model artifacts): every interactive actor denied.
  const sysDenied = await svc.accessCheck('model_artifacts', { uid: 'op_1', workspaceId: 'ws_ops', scopes: ['audit.read'] });
  assert.equal(sysDenied.allowed, false);
});

test('minimization is enforced: a forbidden field refuses (fail closed, not silently dropped)', async () => {
  const { svc } = await makeService();
  // learning_text permits uid/conversationId/turnBody/conceptId/sourceVersion/createdAt.
  const ok = await svc.minimize('learning_text', { uid: OWNER.uid, conversationId: 'conv_1', turnBody: 'hello', conceptId: 'c1', sourceVersion: '1.0.0', createdAt: '2026-10-28' });
  assert.equal(ok.turnBody, 'hello');

  await assert.rejects(
    () => svc.minimize('learning_text', { uid: OWNER.uid, fullTranscript: 'everything the learner said' }),
    (e) => e.code === 'field_not_minimized',
  );
});

test('erasure is EVENT-DRIVEN and covers derived state; legal-minimum classes reported honestly as retained', async () => {
  const { store, svc } = await makeService();
  const receipt = await svc.requestErasure(OWNER.uid, OWNER.workspaceId);
  assert.equal(receipt.revoked, true);
  assert.deepEqual(receipt.deletedClasses.includes('learning_text'), true, 'learning text deleted on request');
  assert.deepEqual(receipt.deletedClasses.includes('source_files'), true, 'source files deleted on request');
  assert.equal(receipt.derivedCachesInvalidated, true, 'derived caches revoked (CACHE-01/AI-05 composition)');
  assert.ok(receipt.retainedClasses.some((r) => r.dataClass === 'billing_audit' && r.reason.includes('legal minimum')), 'billing/audit honestly reported as retained per legal minimum');
  assert.equal(store.revokedUids.has(OWNER.uid), true, 'authorization revoked immediately');

  // After erasure the owner no longer owns the deleted classes.
  assert.equal(await store.isOwner('learning_text', OWNER.uid, OWNER.workspaceId), false);
});

test('model artifacts refuse raw private text; redacted artifacts collect fine', async () => {
  const { store, svc } = await makeService();
  const raw = 'Why does the moon change shape every night exactly?';
  await assert.rejects(
    () => svc.collectArtifact({ runId: 'run_1', fields: { modelVersion: 'v4', learnerText: raw }, rawPrivateText: [raw] }),
    (e) => e.code === 'raw_text_in_artifact',
  );
  // Redacted placeholder passes (KAN-91 composition).
  await svc.collectArtifact({ runId: 'run_1', fields: { modelVersion: 'v4', learnerText: `learner_text:<len:${raw.length}>` }, rawPrivateText: [raw] });
  assert.equal(store.artifactCount(), 1);
});

test('age/admission/guardian flows are explicit: under-age without guardian consent refuses; with consent permitted', async () => {
  const { svc } = await makeService();
  // Adult learner: self-serve.
  const adult = svc.guardianFlow({ learnerAge: 16, admissionAge: 13, guardianConsentActive: false });
  assert.deepEqual(adult, { state: 'self_serve', learningDataAllowed: true });

  // Under-age without guardian consent: guardian_required, processing refused.
  const underAge = svc.guardianFlow({ learnerAge: 9, admissionAge: 13, guardianConsentActive: false });
  assert.deepEqual(underAge, { state: 'guardian_required', learningDataAllowed: false });

  // Under-age WITH active guardian consent: permitted, explicitly labeled.
  const guarded = svc.guardianFlow({ learnerAge: 9, admissionAge: 13, guardianConsentActive: true });
  assert.deepEqual(guarded, { state: 'guardian_active', learningDataAllowed: true });
});
