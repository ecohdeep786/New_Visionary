/**
 * CONTENT-08 (KAN-144) — versioned prerequisite graph and verified
 * curriculum/exam views.
 *
 * Proven here:
 *   1. canonical concepts: idempotent registration, conflicting duplicates
 *      refused; a translation view is locale-tagged on the SAME identity and
 *      never duplicates it,
 *   2. acyclic curation: prerequisite edges form a DAG — a cycle-creating edge
 *      is rejected (fail closed), self-loops and unknown concepts refused,
 *   3. versioned snapshots + rollback: rollbackTo restores an exact earlier
 *      snapshot; concepts/edges registered later do not leak back in,
 *   4. curriculum views distinguish reviewed / provisional / unavailable —
 *      provisional and unavailable are never presented as official coverage,
 *   5. exam views preserve official metadata; weights without calibration
 *      provenance are refused; coverage states stay honest,
 *   6. a gap queue entry never creates syllabus coverage and never promises a
 *      replacement deadline.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { ConceptGraphService } = req('./dist/src/conceptgraph/concept-graph.js');
const { ConceptGraphError } = req('./dist/src/conceptgraph/concept-graph-types.js');
const { InMemoryConceptGraphStore } = req('./dist/src/conceptgraph/concept-graph-lookups.js');

function reviewedConcept(id, title, overrides = {}) {
  return InMemoryConceptGraphStore.concept({ conceptId: id, title, verificationRef: 'review-1', reviewed: true, ...overrides });
}

// ---------------------------------------------------------------------------

test('canonical concepts: idempotent re-register, conflicting duplicate refused; translation view never duplicates the identity', async () => {
  const store = new InMemoryConceptGraphStore();
  const svc = new ConceptGraphService(store);
  const first = await svc.registerCanonical(reviewedConcept('c_newton', 'Newton laws'));
  const again = await svc.registerCanonical(reviewedConcept('c_newton', 'Newton laws'));
  assert.equal(again.conceptId, first.conceptId, 'same identity returns the same canonical concept');

  await assert.rejects(
    () => svc.registerCanonical(reviewedConcept('c_newton', 'Newton laws v2', { version: '2.0.0' })),
    (e) => e instanceof ConceptGraphError && e.code === 'duplicate_identity',
    'conflicting duplicate identity refused',
  );

  // Translation view: SAME canonical identity, locale-tagged — not a new concept.
  await svc.addTranslationView('c_newton', 'hi', 'न्यूटन के नियम');
  const concepts = await store.allConcepts();
  assert.equal(concepts.length, 1, 'translation view did not create a second canonical concept');
  const views = await store.allTranslations();
  assert.equal(views.length, 1);
  assert.equal(views[0].conceptId, 'c_newton');
  assert.equal(views[0].locale, 'hi');

  await assert.rejects(
    () => svc.addTranslationView('c_newton', 'hi', 'duplicate'),
    (e) => e instanceof ConceptGraphError && e.code === 'duplicate_translation',
  );
  await assert.rejects(
    () => svc.addTranslationView('c_ghost', 'hi', 'x'),
    (e) => e instanceof ConceptGraphError && e.code === 'unknown_translation_concept',
  );
});

test('acyclic curation: prerequisite edges form a DAG — a cycle-creating edge is rejected, self-loops and unknown concepts refused', async () => {
  const store = new InMemoryConceptGraphStore();
  const svc = new ConceptGraphService(store);
  for (const [id, title] of [['c_algebra', 'Algebra'], ['c_equations', 'Equations'], ['c_graphs', 'Graphs']]) {
    await svc.registerCanonical(reviewedConcept(id, title));
  }
  await svc.addPrerequisite('c_equations', 'c_algebra'); // equations requires algebra
  await svc.addPrerequisite('c_graphs', 'c_equations');  // graphs requires equations

  // algebra → equations would close the cycle algebra ← equations ← graphs ← algebra.
  await assert.rejects(
    () => svc.addPrerequisite('c_algebra', 'c_graphs'),
    (e) => e instanceof ConceptGraphError && e.code === 'cycle_rejected',
    'cycle-creating edge rejected',
  );
  await assert.rejects(
    () => svc.addPrerequisite('c_algebra', 'c_algebra'),
    (e) => e instanceof ConceptGraphError && e.code === 'self_loop',
  );
  await assert.rejects(
    () => svc.addPrerequisite('c_algebra', 'c_missing'),
    (e) => e instanceof ConceptGraphError && e.code === 'unknown_concept',
  );

  const edges = await store.allEdges();
  assert.equal(edges.length, 2, 'DAG keeps exactly the accepted edges — the graph was never corrupted');
});

test('versioned snapshots + rollback: rollbackTo restores an exact earlier snapshot and later edits do not leak back in', async () => {
  const store = new InMemoryConceptGraphStore();
  const svc = new ConceptGraphService(store);
  await svc.registerCanonical(reviewedConcept('c_motion', 'Motion'));
  await svc.registerCanonical(reviewedConcept('c_force', 'Force'));
  await svc.addPrerequisite('c_force', 'c_motion');
  const v1 = await svc.snapshot();

  // Later edits after v1.
  await svc.registerCanonical(reviewedConcept('c_energy', 'Energy'));
  await svc.addPrerequisite('c_energy', 'c_force');
  const v2 = await svc.snapshot();
  assert.ok(v2 > v1, 'snapshot version increments');

  await svc.rollbackTo(v1);
  const concepts = (await store.allConcepts()).map((c) => c.conceptId);
  assert.deepEqual([...concepts].sort(), ['c_force', 'c_motion'], 'post-v1 concept removed by rollback');
  const edges = await store.allEdges();
  assert.deepEqual(edges, [{ conceptId: 'c_force', prerequisiteId: 'c_motion' }], 'post-v1 edge removed; snapshot edge restored exactly');
  assert.equal(await store.currentSnapshotVersion(), v1);

  await assert.rejects(
    () => svc.rollbackTo(99),
    (e) => e instanceof ConceptGraphError && e.code === 'unknown_snapshot',
  );
});

test('curriculum view distinguishes reviewed / provisional / unavailable — provisional is never official coverage', async () => {
  const store = new InMemoryConceptGraphStore();
  const svc = new ConceptGraphService(store);
  await svc.registerCanonical(reviewedConcept('c_a', 'A'));
  await svc.registerCanonical(InMemoryConceptGraphStore.concept({ conceptId: 'c_draft', title: 'Unverified draft' }));
  await svc.registerCanonical(reviewedConcept('c_gone', 'Gone'));
  await svc.addPrerequisite('c_a', 'c_gone');
  await store.removeConcept('c_gone'); // source withdrawn from the catalog

  const view = await svc.curriculumView('ed-2024');
  assert.deepEqual(view.reviewed, ['c_a'], 'only verified concepts in this edition are reviewed coverage');
  assert.deepEqual(view.unavailable, ['c_gone'], 'edge-referenced concept with no source is unavailable');
  assert.deepEqual(view.provisional, ['c_draft'], 'unverified concept is provisional, never official');
  assert.ok(!view.reviewed.includes('c_draft'), 'provisional never presented as official coverage');
});

test('curriculum view marks unverified concepts provisional (never reviewed) and keeps editions distinct', async () => {
  const store = new InMemoryConceptGraphStore();
  const svc = new ConceptGraphService(store);
  await svc.registerCanonical(reviewedConcept('c_ok', 'Verified', { edition: 'ed-2024' }));
  await svc.registerCanonical(InMemoryConceptGraphStore.concept({ conceptId: 'c_unverified', title: 'Unverified', edition: 'ed-2024' }));
  await svc.registerCanonical(reviewedConcept('c_old_ed', 'Old edition verified', { edition: 'ed-2023' }));

  const view2024 = await svc.curriculumView('ed-2024');
  assert.deepEqual(view2024.reviewed, ['c_ok'], 'only the current-edition verified concept is reviewed');
  assert.deepEqual(view2024.provisional.sort(), ['c_old_ed', 'c_unverified'], 'unverified and other-edition concepts are provisional, not official');
});

test('exam view: official metadata preserved; weight without calibration provenance refused; unknown concept refused; coverage honest', async () => {
  const store = new InMemoryConceptGraphStore();
  const svc = new ConceptGraphService(store);
  await svc.registerCanonical(reviewedConcept('c_num', 'Number system'));
  await svc.registerCanonical(InMemoryConceptGraphStore.concept({ conceptId: 'c_unverified', title: 'Unverified' }));

  await assert.rejects(
    () => svc.examView(
      { examId: 'exam_icse_2024', board: 'CISCE', year: '2024', sourceClass: 'official_exam', edition: 'ed-2024' },
      [{ name: 'Section A', weights: [{ conceptId: 'c_num', weight: 0.4, calibrationRef: '' }] }],
    ),
    (e) => e instanceof ConceptGraphError && e.code === 'weight_without_provenance',
    'a weight without calibration provenance is refused',
  );
  await assert.rejects(
    () => svc.examView(
      { examId: 'exam_icse_2024', board: 'CISCE', year: '2024', sourceClass: 'official_exam', edition: 'ed-2024' },
      [{ name: 'Section A', weights: [{ conceptId: 'c_missing', weight: 0.4, calibrationRef: 'cal-2024' }] }],
    ),
    (e) => e instanceof ConceptGraphError && e.code === 'unknown_concept',
  );

  const view = await svc.examView(
    { examId: 'exam_icse_2024', board: 'CISCE', year: '2024', sourceClass: 'official_exam', edition: 'ed-2024' },
    [
      { name: 'Section A', weights: [{ conceptId: 'c_num', weight: 0.4, calibrationRef: 'cal-2024-a' }] },
      { name: 'Section B', weights: [{ conceptId: 'c_unverified', weight: 0.2, calibrationRef: 'cal-2024-b' }] },
    ],
  );
  assert.equal(view.metadata.board, 'CISCE');
  assert.equal(view.metadata.sourceClass, 'official_exam');
  assert.equal(view.metadata.edition, 'ed-2024');
  const byId = new Map(view.coverage.map((c) => [c.conceptId, c.state]));
  assert.equal(byId.get('c_num'), 'reviewed');
  assert.equal(byId.get('c_unverified'), 'provisional', 'unverified concept stays provisional inside the exam view');
});

test('a gap queue entry never creates syllabus coverage and never promises a replacement deadline', async () => {
  const store = new InMemoryConceptGraphStore();
  const svc = new ConceptGraphService(store);
  await svc.registerCanonical(reviewedConcept('c_before', 'Before'));
  const viewBefore = await svc.curriculumView('ed-2024');

  const gap = await svc.queueGap({ gapId: 'gap_1', subject: 'Mathematics', requestedCoverage: 'Trigonometry grade 9', requestedBy: 'org_1' });
  assert.equal(gap.promisedDeadline, null, 'no unstaffed replacement deadline is ever promised');

  const viewAfter = await svc.curriculumView('ed-2024');
  assert.deepEqual(viewAfter.reviewed, viewBefore.reviewed, 'queueing a gap created NO syllabus coverage');
  assert.ok(!viewAfter.reviewed.includes('gap_1'), 'the gap is not official coverage');

  const gaps = await store.gaps();
  assert.equal(gaps.length, 1, 'the gap is recorded in the queue only');
});

test('gap-driven coverage stays unavailable, never invented official', async () => {
  const store = new InMemoryConceptGraphStore();
  const svc = new ConceptGraphService(store);
  await svc.registerCanonical(reviewedConcept('c_real', 'Real content'));
  await svc.queueGap({ gapId: 'gap_tri', subject: 'Mathematics', requestedCoverage: 'Trigonometry', requestedBy: 'org_1' });

  const view = await svc.curriculumView('ed-2024');
  assert.deepEqual(view.reviewed, ['c_real'], 'only the real reviewed source is official coverage');
  assert.deepEqual(view.unavailable, [], 'a queued gap alone does not even register a concept — nothing is invented');
  assert.deepEqual(view.provisional, []);
});
