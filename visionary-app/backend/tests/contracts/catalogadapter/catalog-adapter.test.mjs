/**
 * CONTENT-04 (KAN-63) — catalog/concept adapters connected to reviewed server
 * DTOs.
 *
 * Proven here:
 *   1. getSyllabus/getConcept return the REVIEWED DTO shapes (ConceptDTO,
 *      GraphDTO, SubjectCatalogueDTO) derived from released, eligible catalog
 *      facts — a miss is null, never invented curriculum.
 *   2. locale/source-language distinctions are preserved: authored language,
 *      interface language and released locales stay distinct; a released+
 *      eligible concept whose released locales exclude the requested interface
 *      locale reports `languageUnavailable: true` with the true availableLocales
 *      (present but not supported in that language — never an invented
 *      translation).
 *   3. authoring representations are passed through unchanged on the concept DTO.
 *   4. unsupported/unavailable states are explicit: a selection or concept with
 *      no released, eligible source returns null.
 *   5. withdrawal / pointer demotion / source rejection immediately change what
 *      the adapter returns (server-live; no authoritative cache).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../upstream/backend');
const req = createRequire(resolve(backendRoot, 'package.json'));

const { CatalogDtoAdapter } = req('./dist/src/catalogadapter/catalog-adapter.js');
const { InMemoryAdapterStore } = req('./dist/src/catalogadapter/catalog-adapter-lookups.js');

// ---------------------------------------------------------------------------

test('getSyllabus returns the reviewed graph DTO from released eligible catalog facts (a miss is null)', async () => {
  const store = new InMemoryAdapterStore();
  store.addNode(InMemoryAdapterStore.node({ catalogId: 'topic_math_7', kind: 'topic', title: 'Integers', parentId: 'book_math_7', subject: 'Mathematics', board: 'CISCE', classLevel: '7' }));
  store.addNode(InMemoryAdapterStore.node({
    catalogId: 'concept_int', kind: 'concept', title: 'Integers', parentId: 'topic_math_7', subject: 'Mathematics', board: 'CISCE', classLevel: '7',
    source: { provider: 'cisce', version: '1.1.0' },
  }));
  const adapter = new CatalogDtoAdapter(store);
  const graph = await adapter.getSyllabus('CISCE', '7', 'Mathematics', 'en');
  assert.ok(graph, 'released syllabus returned');
  assert.equal(graph.syllabus.subject, 'Mathematics');
  assert.equal(graph.syllabus.provenance.provider, 'cisce');
  assert.equal(graph.syllabus.provenance.version, '1.1.0');
  assert.deepEqual(graph.syllabus.availableLocales, ['en']);
  assert.equal(graph.concepts.length, 1);
  assert.equal(graph.concepts[0].id, 'concept_int');
  assert.equal(graph.concepts[0].status, 'official');

  // A selection with no released source is null, never an invented syllabus.
  const miss = await adapter.getSyllabus('CISCE', '7', 'History', 'en');
  assert.equal(miss, null, 'unreleased selection is a miss (null), not invented curriculum');
});

test('locale/source-language distinction preserved: released locales gate what is served; authored language never fabricates a locale', async () => {
  const store = new InMemoryAdapterStore();
  // Concept authored in Hindi but released ONLY for English.
  store.addNode(InMemoryAdapterStore.node({
    catalogId: 'concept_frac', kind: 'concept', title: 'Fractions', parentId: 'topic_math_7', subject: 'Mathematics', board: 'CISCE', classLevel: '7',
    authoredLanguage: 'hi', releasedLocales: ['en'], source: { provider: 'cisce', version: '2.0.0' },
  }));
  const adapter = new CatalogDtoAdapter(store);

  // Requested en: served, not languageUnavailable.
  const en = await adapter.getConcept('concept_frac', 'en');
  assert.ok(en, 'en-requested concept served');
  assert.equal(en.languageUnavailable, false);
  assert.deepEqual(en.availableLocales, ['en'], 'released locales are real, authored language hi is not offered');

  // Requested hi: the concept is released+eligible but NOT supported in Hindi.
  const hi = await adapter.getConcept('concept_frac', 'hi');
  assert.ok(hi, 'concept exists (released) so it is not a null miss');
  assert.equal(hi.languageUnavailable, true, 'present but not supported in Hindi');
  assert.deepEqual(hi.availableLocales, ['en'], 'only English is actually available');
  assert.equal(hi.locale, 'hi', 'interface locale is distinct from availableLocales');
});

test('authoring representations are preserved unchanged on the concept DTO', async () => {
  const store = new InMemoryAdapterStore();
  const reps = [
    InMemoryAdapterStore.rep({ id: 'rep_int_numline', kind: 'number-line', alternative: 'draw a number line', numberLine: { minimum: -5, maximum: 5, divisions: 10, initial: 0 } }),
    InMemoryAdapterStore.rep({ id: 'rep_int_visual', kind: 'diagram', alternative: 'show integer chips' }),
  ];
  store.addNode(InMemoryAdapterStore.node({ catalogId: 'concept_int', kind: 'concept', title: 'Integers', parentId: 'topic_math_7', subject: 'Mathematics', representations: reps }));
  const adapter = new CatalogDtoAdapter(store);
  const concept = await adapter.getConcept('concept_int', 'en');
  assert.ok(concept);
  assert.equal(concept.representations.length, 2, 'both authored representations preserved');
  assert.equal(concept.representations[0].kind, 'number-line');
  assert.deepEqual(concept.representations[0].numberLine, { minimum: -5, maximum: 5, divisions: 10, initial: 0 });
  assert.equal(concept.representations[1].kind, 'diagram');
  assert.equal(concept.representations[0].alternative, 'draw a number line');
});

test('getSubjects returns only subjects with released eligible content; null when none', async () => {
  const store = new InMemoryAdapterStore();
  store.addNode(InMemoryAdapterStore.node({ catalogId: 'concept_math', kind: 'concept', title: 'Fractions', subject: 'Mathematics', board: 'CISCE', classLevel: '7' }));
  store.addNode(InMemoryAdapterStore.node({ catalogId: 'concept_sci', kind: 'concept', title: 'Matter', subject: 'Science', board: 'CISCE', classLevel: '8' }));
  // Unreleased subject never listed.
  store.addNode(InMemoryAdapterStore.node({ catalogId: 'concept_hist', kind: 'concept', title: 'Kings', subject: 'History', board: 'CISCE', classLevel: '7', sourceRelease: 'pending', releasedLocales: [] }));
  const adapter = new CatalogDtoAdapter(store);
  const subjects = await adapter.getSubjects('CISCE', '7');
  assert.deepEqual([...subjects.subjects], ['Mathematics'], 'only released, eligible subjects listed');
  const none = await adapter.getSubjects('CISCE', '12');
  assert.equal(none, null, 'no released content for the level is a null miss');
});

test('unknown / unreleased / not-eligible concept returns null — a miss is null (never invented)', async () => {
  const store = new InMemoryAdapterStore();
  store.addNode(InMemoryAdapterStore.node({ catalogId: 'concept_draft', kind: 'concept', title: 'Draft', parentId: 'topic_x', subject: 'Mathematics', sourceRelease: 'pending', releasedLocales: [], eligibleForRetrieval: false }));
  const adapter = new CatalogDtoAdapter(store);
  const unknown = await adapter.getConcept('no_such_concept', 'en');
  assert.equal(unknown, null, 'unknown concept is null');
  const unreleased = await adapter.getConcept('concept_draft', 'en');
  assert.equal(unreleased, null, 'unreleased/not-eligible concept is null');
});

test('withdrawal / pointer demotion / source rejection immediately change adapter output (server-live, no cache)', async () => {
  const store = new InMemoryAdapterStore();
  store.addNode(InMemoryAdapterStore.node({ catalogId: 'concept_alg', kind: 'concept', title: 'Algebra', parentId: 'topic_math_8', subject: 'Mathematics', board: 'CISCE', classLevel: '8' }));
  const adapter = new CatalogDtoAdapter(store);

  let before = await adapter.getSyllabus('CISCE', '8', 'Mathematics', 'en');
  assert.ok(before, 'served before withdrawal');

  // Withdraw: no released locale remains.
  store.removeNode('concept_alg');
  store.addNode(InMemoryAdapterStore.node({ catalogId: 'concept_alg', kind: 'concept', title: 'Algebra', parentId: 'topic_math_8', subject: 'Mathematics', board: 'CISCE', classLevel: '8', releasedLocales: [], sourceRelease: 'rejected' }));
  let after = await adapter.getSyllabus('CISCE', '8', 'Mathematics', 'en');
  assert.equal(after, null, 'withdrawal removes the syllabus (server-live)');

  // Re-release restores it immediately.
  store.removeNode('concept_alg');
  store.addNode(InMemoryAdapterStore.node({ catalogId: 'concept_alg', kind: 'concept', title: 'Algebra', parentId: 'topic_math_8', subject: 'Mathematics', board: 'CISCE', classLevel: '8', releasedLocales: ['en'] }));
  after = await adapter.getSyllabus('CISCE', '8', 'Mathematics', 'en');
  assert.ok(after, 'server-live: release restores delivery immediately');
});

test('getSyllabus maps topics with their released concept ids into the reviewed graph DTO', async () => {
  const store = new InMemoryAdapterStore();
  store.addNode(InMemoryAdapterStore.node({ catalogId: 'topic_num', kind: 'topic', title: 'Number System', parentId: 'book_math_7', subject: 'Mathematics', board: 'CISCE', classLevel: '7' }));
  store.addNode(InMemoryAdapterStore.node({ catalogId: 'concept_int', kind: 'concept', title: 'Integers', parentId: 'topic_num', subject: 'Mathematics', board: 'CISCE', classLevel: '7' }));
  store.addNode(InMemoryAdapterStore.node({ catalogId: 'concept_frac', kind: 'concept', title: 'Fractions', parentId: 'topic_num', subject: 'Mathematics', board: 'CISCE', classLevel: '7' }));
  const adapter = new CatalogDtoAdapter(store);
  const graph = await adapter.getSyllabus('CISCE', '7', 'Mathematics', 'en');
  assert.ok(graph);
  assert.equal(graph.topics.length, 1, 'topic from the selection mapped into the graph');
  assert.equal(graph.topics[0].id, 'topic_num');
  assert.equal(graph.topics[0].conceptIds.length, 2, 'both released concepts gathered under the topic');
  assert.deepEqual(new Set(graph.topics[0].conceptIds), new Set(['concept_int', 'concept_frac']));
  assert.equal(graph.topics[0].status, 'official');
});
