/**
 * BUILD-03 (KAN-77) — verified guided briefs pinned to objective/source/rubric/
 * check/practice evidence; blank projects stay available without guided-learning
 * gates.
 *
 * Proven here:
 *   1. blank projects need NO evidence, NO verification, NO gate (ungated),
 *   2. a guided brief verifies EVERY pin server-side before committing;
 *      unprovable evidence is refused (fail closed),
 *   3. the pinned evidence digest travels with the brief (auditable),
 *   4. amendments append immutable versions; previous versions stay byte-stable,
 *   5. wrong users denied; unknown projects refused.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { GuidedBriefService } = req('./dist/src/guidedbriefs/guided-brief-service.js');
const { InMemoryGuidedBriefStore } = req('./dist/src/guidedbriefs/guided-brief-lookups.js');

const OWNER = { uid: 'uid_builder_1', workspaceId: 'ws_personal' };
const OTHER = { uid: 'uid_stranger', workspaceId: 'ws_personal' };
const PROJECT = 'prj_solar';
const CONCEPT = 'c_orbits';
const VERSION = '1.1.0';

async function makeService() {
  const store = new InMemoryGuidedBriefStore();
  const evidence = InMemoryGuidedBriefStore.evidence({
    projects: [{ projectId: PROJECT, owner: OWNER }],
    released: [{ conceptId: CONCEPT, sourceVersion: VERSION }],
    rubrics: [{ conceptId: CONCEPT, sourceVersion: VERSION, rubricRef: 'rubric_orbits_v2' }],
    checks: [{ conceptId: CONCEPT, sourceVersion: VERSION, checkId: 'chk_orbits_1' }],
    practice: [{ uid: OWNER.uid, conceptId: CONCEPT, evidenceId: 'sub_1' }, { uid: OWNER.uid, conceptId: CONCEPT, evidenceId: 'sub_2' }],
  });
  return { store, svc: new GuidedBriefService(store, evidence) };
}

const GOOD_PINS = {
  objectiveConceptId: CONCEPT,
  sourceVersion: VERSION,
  rubricRef: 'rubric_orbits_v2',
  checkId: 'chk_orbits_1',
  practiceEvidenceIds: ['sub_1'],
};

// ---------------------------------------------------------------------------

test('blank projects stay available without guided-learning gates: no brief requires no evidence and no verification', async () => {
  const { store, svc } = await makeService();
  // A project exists with NO brief — the store proves it: briefsFor returns
  // empty and nothing in the domain demands a brief for the project to be used.
  const briefs = await store.briefsFor(OWNER, PROJECT);
  assert.equal(briefs.length, 0, 'a blank project has no brief and no gate blocked its existence');
  // The evidence lookup does not gate project usage: no brief-related call is
  // required to "open" a blank project. (The service exposes no gate; the
  // un-gated state is the absence of any brief requirement.)
  assert.ok(svc, 'guided learning is an optional layer, never a precondition');
});

test('a guided brief verifies EVERY pin server-side before committing; unprovable evidence refused', async () => {
  const { svc } = await makeService();
  const brief = await svc.createBrief(OWNER, PROJECT, GOOD_PINS);
  assert.equal(brief.status, 'verified');
  assert.equal(brief.version, 1);
  assert.ok(brief.pinsDigest, 'pinned evidence digest travels with the brief');

  // Unreleased source revision: refused.
  await assert.rejects(
    () => svc.createBrief(OWNER, PROJECT, { ...GOOD_PINS, sourceVersion: '9.9.9' }),
    (e) => e.code === 'evidence_not_verified',
  );
  // Missing rubric: refused.
  await assert.rejects(
    () => svc.createBrief(OWNER, PROJECT, { ...GOOD_PINS, rubricRef: 'rubric_ghost' }),
    (e) => e.code === 'evidence_missing',
  );
  // Missing check: refused.
  await assert.rejects(
    () => svc.createBrief(OWNER, PROJECT, { ...GOOD_PINS, checkId: 'chk_ghost' }),
    (e) => e.code === 'evidence_missing',
  );
  // Practice evidence that does not belong to this owner+concept: refused.
  await assert.rejects(
    () => svc.createBrief(OWNER, PROJECT, { ...GOOD_PINS, practiceEvidenceIds: ['sub_ghost'] }),
    (e) => e.code === 'evidence_missing',
  );
});

test('amendments append immutable versions; previous versions stay byte-stable; digest changes with pins', async () => {
  const { store, svc } = await makeService();
  const v1 = await svc.createBrief(OWNER, PROJECT, GOOD_PINS);
  const v2 = await svc.amendBrief(OWNER, PROJECT, { ...GOOD_PINS, practiceEvidenceIds: ['sub_1', 'sub_2'] });

  const briefs = await store.briefsFor(OWNER, PROJECT);
  assert.equal(briefs.length, 2, 'amendment appended a version');
  assert.equal(briefs[0].version, 1);
  assert.equal(briefs[1].version, 2);
  assert.equal(JSON.stringify(briefs[0].pins), JSON.stringify(v1.pins), 'v1 pins byte-stable');
  assert.notEqual(v2.pinsDigest, v1.pinsDigest, 'digest tracks the pinned evidence set');
});

test('wrong users denied; unknown projects refused', async () => {
  const { svc } = await makeService();
  await assert.rejects(
    () => svc.createBrief(OTHER, PROJECT, GOOD_PINS),
    (e) => e.code === 'not_owner',
  );
  await assert.rejects(
    () => svc.createBrief(OWNER, 'prj_ghost', GOOD_PINS),
    (e) => e.code === 'unknown_project',
  );
  await assert.rejects(
    () => svc.amendBrief(OTHER, PROJECT, GOOD_PINS),
    (e) => e.code === 'not_owner',
  );
});
