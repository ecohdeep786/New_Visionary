import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { configureMock, seedDemo } from '../src/services/workspaceService.ts';
import { configureContentRepository, getContentRepository, SAMPLE_SELECTION } from '../src/services/contentRepository.ts';
import { configureTeachingInterface, getTeachingInterface } from '../src/services/teachingInterface.ts';

const memory = new Map();
globalThis.localStorage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) };
globalThis.window = { dispatchEvent() {} };
globalThis.CustomEvent ??= class { constructor(type) { this.type = type; } };
const ctx = (person = 'adult', locale = 'en') => ({ personId: `demo-${person}`, workspaceId: `demo-${person}:student`, role: 'student', locale });
const query = { board: 'Unconnected board', classLevel: '7', subject: 'My subject' };
const syllabus = (repository, selection = query) => repository.getSyllabus(selection.board, selection.classLevel, selection.subject);
const contentKey = 'visionary_content_v1';
const source = { provider: 'Reviewed syllabus fixture', sourceId: 'board:7:subject', version: '2026.1' };
const officialConcept = (overrides = {}) => ({ id: 'official:concept', title: 'Supplied concept', topicId: 'official:topic', prerequisiteIds: [], status: 'official', representations: [], audience: 'general', locale: 'en', availableLocales: ['en'], provenance: source, ...overrides });
const officialGraph = (overrides = {}) => ({
 syllabus: { ...query, id: 'official:syllabus', status: 'official', contentLocale: 'en', availableLocales: ['en'], provenance: source, textbooks: [{ id: 'official:book', title: 'Supplied textbook', chapterIds: ['official:chapter'] }], chapters: [{ id: 'official:chapter', title: 'Supplied chapter', textbookId: 'official:book', topicIds: ['official:topic'], status: 'official' }] },
 topics: [{ id: 'official:topic', title: 'Supplied topic', chapterId: 'official:chapter', conceptIds: ['official:concept'], status: 'official' }],
 concepts: [officialConcept()], ...overrides,
});
const ready = () => ({ status: 'ready', source: 'adapter', text: 'Adapter contract fixture — no answer-quality assertion.' });

beforeEach(() => {
 memory.clear(); configureContentRepository(null); configureTeachingInterface(null);
 configureMock({ latency: 0, fault: 'none', now: () => new Date('2026-09-23T12:00:00Z') }); seedDemo('adult');
});

test('a database miss persists a numbered provisional hierarchy and one scoped gap without invented teaching content', async () => {
 const repository = getContentRepository(ctx()); const first = await syllabus(repository);
 assert.equal(first.status, 'provisional'); assert.match(first.id, /^provisional:[a-f0-9]{16}$/);
 const chapters = await repository.getChapters(first.id); const topics = await repository.getTopics(chapters[0].id); const concepts = await repository.getConcepts(topics[0].id);
 assert.equal(chapters[0].title, 'Chapter 1'); assert.equal(topics[0].title, 'Topic 1'); assert.equal(concepts[0].title, 'Concept 1');
 assert.equal(concepts[0].explanation, undefined); assert.equal(concepts[0].check, undefined); assert.equal(concepts[0].project, undefined);
 assert.deepEqual(await syllabus(getContentRepository(ctx())), first);
 const gaps = await repository.getDataGaps(); assert.equal(gaps.length, 1); assert.equal(gaps[0].user_id, ctx().personId); assert.equal(gaps[0].subject, query.subject); assert.ok(gaps[0].timestamp);
 assert.deepEqual(await getContentRepository(ctx('minor-cbse')).getDataGaps(), []);
 assert.equal(await getContentRepository(ctx('minor-cbse')).getConcept(concepts[0].id), null);
});

test('new provisional object IDs never contain raw personal labels and remain deterministic', async () => {
 const sensitive = { board: 'person@example.test', classLevel: '+91 98765 43210', subject: 'My private name' };
 const a = await syllabus(getContentRepository(ctx()), sensitive); const b = await syllabus(getContentRepository(ctx('minor-cbse')), sensitive);
 assert.equal(a.id, b.id); assert.match(a.id, /^provisional:[a-f0-9]{16}$/);
 assert.ok(!a.id.includes('example')); assert.ok(!JSON.stringify(a.textbooks).includes('private'));
 assert.notEqual(a.id, (await syllabus(getContentRepository(ctx()), { ...sensitive, subject: 'Other subject' })).id);
});

test('renaming owned provisional nodes survives reload and failed writes retain the prior name', async () => {
 const repository = getContentRepository(ctx()); const graph = await syllabus(repository); const chapter = graph.chapters[0];
 await repository.renameProvisional(chapter.id, 'My chapter');
 assert.equal((await getContentRepository(ctx()).getChapters(graph.id))[0].title, 'My chapter');
 const set = localStorage.setItem; localStorage.setItem = () => { throw Error('full'); };
 try { await assert.rejects(repository.renameProvisional(chapter.id, 'Not saved'), /could not be saved/); }
 finally { localStorage.setItem = set; }
 assert.equal((await repository.getChapters(graph.id))[0].title, 'My chapter');
 await assert.rejects(getContentRepository(ctx('minor-cbse')).renameProvisional(chapter.id, 'Not mine'), /Only your provisional/);
 await assert.rejects(repository.renameProvisional(chapter.id, '  '), /Enter a name/);
});

test('official arrival maps a provisional concept without changing its progress/session identifier', async () => {
 const repository = getContentRepository(ctx()); const provisional = await syllabus(repository);
 const topic = (await repository.getTopics(provisional.chapters[0].id))[0]; const previous = (await repository.getConcepts(topic.id))[0];
 const ownedProgress = { conceptId: previous.id, completedChecks: 2 }; memory.set('test_owned_progress', JSON.stringify(ownedProgress));
 configureContentRepository({ async getSyllabus() { return officialGraph(); } });
 const supplied = await syllabus(repository); assert.equal(supplied.status, 'official');
 await repository.mapProvisional(previous.id, 'official:concept');
 const mapped = await repository.getConcept(previous.id);
 assert.equal(mapped.id, previous.id); assert.equal(mapped.officialId, 'official:concept'); assert.equal(mapped.status, 'official');
 assert.deepEqual(JSON.parse(memory.get('test_owned_progress')), ownedProgress);
 assert.ok((await repository.getDataGaps())[0].resolvedAt);
 assert.equal((await repository.getChapters(provisional.id))[0].id, provisional.chapters[0].id);
 configureContentRepository(null);
 assert.equal((await syllabus(repository)).id, supplied.id, 'disconnecting the adapter retains the previously received official graph');
});

test('existing owned legacy IDs are reused rather than rewritten', async () => {
 const repository = getContentRepository(ctx()); const result = await syllabus(repository); const db = JSON.parse(memory.get(contentKey));
 const oldId = `provisional:${encodeURIComponent(JSON.stringify(query))}`;
 const graph = db.spaces[ctx().workspaceId].graphs[0];
 db.spaces[ctx().workspaceId].graphs[0] = JSON.parse(JSON.stringify(graph).split(result.id).join(oldId));
 memory.set(contentKey, JSON.stringify(db));
 assert.equal((await syllabus(repository)).id, oldId);
 assert.equal((await repository.getChapters(oldId))[0].id, `${oldId}:chapter:1`);
});

test('sample concepts are available after syllabus retrieval and resolve English, Hindi and Bengali independently', async () => {
 await syllabus(getContentRepository(ctx()), SAMPLE_SELECTION);
 for (const [locale, script] of [['en', /cube/i], ['hi', /[\u0900-\u097f]/], ['bn', /[\u0980-\u09ff]/]]) {
  const repository = getContentRepository(ctx('adult', locale)); const concept = await repository.getConcept('sample:cube:concept');
  assert.equal(concept.locale, locale); assert.equal(concept.status, 'sample'); assert.match(concept.title, script);
  assert.equal(concept.check.source, 'authored-sample'); assert.equal(concept.id, 'sample:cube:concept');
  assert.match((await repository.getChapters('sample:math'))[1].title, script);
 }
 assert.equal(await getContentRepository(ctx()).getConcept('never-present'), null);
});

test('adult content is rejected for minors and unauthorized workspace identities fail before content access', async () => {
 configureContentRepository({ async getSyllabus() { return officialGraph({ concepts: [officialConcept({ audience: 'adult' })] }); }, async getConcept() { return officialConcept({ audience: 'adult' }); } });
 const minor = getContentRepository(ctx('minor-cbse')); const graph = await syllabus(minor);
 assert.equal(await minor.getConcept('official:concept'), null);
 assert.deepEqual(await minor.getConcepts(graph.chapters[0].topicIds[0]), []);
 assert.equal((await getContentRepository(ctx()).getConcept('official:concept')).audience, 'adult');
 assert.throws(() => getContentRepository({ ...ctx(), personId: 'demo-parent' }), /access/);
});

test('invalid remote content cannot replace saved curriculum and unsuccessful writes leave no phantom graph', async () => {
 const repository = getContentRepository(ctx()); await syllabus(repository); const before = memory.get(contentKey);
 configureContentRepository({ async getSyllabus() { const graph = officialGraph(); graph.concepts[0].check = { id: 'bad', prompt: 'Question', options: [], answerIndex: 99, source: 'database' }; return graph; } });
 await assert.rejects(syllabus(repository), /incomplete question/); assert.equal(memory.get(contentKey), before);
 configureContentRepository({ async getSyllabus() { const graph = officialGraph(); graph.syllabus.subject = 'Other'; return graph; } });
 await assert.rejects(syllabus(repository), /does not match/); assert.equal(memory.get(contentKey), before);
 configureContentRepository(null); const set = localStorage.setItem; localStorage.setItem = () => { throw Error('full'); };
 try { await assert.rejects(syllabus(repository, { ...query, subject: 'New' }), /could not be saved/); } finally { localStorage.setItem = set; }
 assert.equal(memory.get(contentKey), before);
});

test('connected curriculum requires a source version and explicit concept-language availability', async () => {
 const repository = getContentRepository(ctx()); const before = memory.get(contentKey);
 for (const changed of [
  graph => { delete graph.syllabus.provenance; },
  graph => { graph.syllabus.availableLocales = []; },
  graph => { graph.concepts[0].locale = 'hi'; },
  graph => { graph.concepts[0].availableLocales = ['bn']; },
 ]) {
  configureContentRepository({ async getSyllabus() { const graph = officialGraph(); changed(graph); return graph; } });
  await assert.rejects(syllabus(repository), /source version and explicit language availability/);
  assert.equal(memory.get(contentKey), before);
 }
 configureContentRepository({ async getSyllabus() { return null; }, async getConcept() { return officialConcept({ provenance: undefined }); } });
 await assert.rejects(repository.getConcept('official:concept'), /source version/);
});

test('a source-language outline cannot masquerade as translated teaching; localized graph versions coexist', async () => {
 const english = officialGraph({ concepts: [officialConcept({ explanation: 'An English explanation.', check: { id: 'check', prompt: 'English question?', options: ['A', 'B'], answerIndex: 0, source: 'database' } })] });
 configureContentRepository({ async getSyllabus() { return english; } });
 await syllabus(getContentRepository(ctx('adult', 'hi')));
 const hindiRepository = getContentRepository(ctx('adult', 'hi'));
 const fallback = await hindiRepository.getConcept('official:concept');
 assert.equal(fallback.locale, 'en');
 assert.equal(fallback.languageUnavailable, true);
 assert.equal(fallback.explanation, undefined);
 assert.equal(fallback.check, undefined);
 const concepts = await hindiRepository.getConcepts('official:topic');
 assert.equal(concepts[0].languageUnavailable, true);
 const hindi = officialGraph({
  syllabus: { ...english.syllabus, contentLocale: 'hi', availableLocales: ['en', 'hi'] },
  concepts: [officialConcept({ title: 'सत्यापित अवधारणा', locale: 'hi', availableLocales: ['en', 'hi'], explanation: 'हिंदी में व्याख्या।' })],
 });
 configureContentRepository({ async getSyllabus() { return hindi; } });
 await syllabus(hindiRepository);
 assert.equal((await hindiRepository.getConcept('official:concept')).explanation, 'हिंदी में व्याख्या।');
 configureContentRepository(null);
 assert.equal((await getContentRepository(ctx()).getConcept('official:concept')).explanation, 'An English explanation.');
 assert.equal((await hindiRepository.getConcept('official:concept')).locale, 'hi');
});

test('content requests cancel promptly, including adapters that ignore the cancellation signal', async () => {
 const controller = new AbortController(); let resolve;
 configureContentRepository({ getSyllabus: () => new Promise(done => { resolve = done; }) });
 const pending = syllabus(getContentRepository({ ...ctx(), signal: controller.signal })); controller.abort();
 await assert.rejects(pending, { name: 'AbortError' }); resolve(officialGraph()); await Promise.resolve();
 assert.equal(memory.get(contentKey), undefined);
 assert.throws(() => getContentRepository({ ...ctx(), signal: controller.signal }), { name: 'AbortError' });
});

test('unconnected teaching returns an honest status for all modes and creates no generated answer or storage record', async () => {
 const api = getTeachingInterface(ctx()); const before = new Map(memory);
 for (const method of ['requestExplanation', 'requestPracticeQuestion', 'requestFeedback', 'requestProjectGuidance']) {
  const response = await api[method]({ input: 'My question' });
  assert.equal(response.status, 'not_connected'); assert.equal(response.source, 'not_connected'); assert.equal(response.question, undefined);
  assert.match(response.text, /not connected/);
 }
 assert.deepEqual(memory, before);
});

test('the teaching seam forwards all four modes and cloned packets without interpreting answer quality', async () => {
 const calls = []; configureTeachingInterface({ async request(mode, packet, request) { calls.push({ mode, packet: structuredClone(packet), request }); packet.input = 'adapter mutation'; return ready(); } });
 const api = getTeachingInterface(ctx()); const packet = { input: 'Saved prompt', language: 'hi', conceptId: 'concept:1', sessionId: 'session:1', difficulty: 2, intent: 'check', promptVersion: 'contract-v1' };
 const methods = ['requestExplanation', 'requestPracticeQuestion', 'requestFeedback', 'requestProjectGuidance'];
 for (const method of methods) assert.equal((await api[method](packet)).status, 'ready');
 assert.deepEqual(calls.map(call => call.mode), ['explanation', 'practice', 'feedback', 'project']);
 assert.ok(calls.every(call => call.packet.input === 'Saved prompt' && call.packet.language === 'hi'));
 assert.equal(packet.input, 'Saved prompt');
});

test('English, Hindi and Bengali crisis input or context stops before an adapter can receive it', async () => {
 let calls = 0; configureTeachingInterface({ async request() { calls++; return ready(); } });
 for (const [locale, input] of [['en', 'I want to die'], ['hi', 'मैं आत्महत्या करना चाहता हूँ'], ['bn', 'আমি বাঁচতে চাই না']]) {
  const api = getTeachingInterface(ctx('adult', locale));
  for (const packet of [{ input, language: locale }, { input: 'Help with this material', context: { material: input }, language: locale }]) {
   const response = await api.requestExplanation(packet);
   assert.equal(response.status, 'blocked'); assert.equal(response.source, 'safety'); assert.equal(response.question, undefined); assert.ok(response.text.length > 0);
  }
 }
 assert.equal(calls, 0);
});

test('minor and unknown age profiles cannot request adult teaching or leak through forged context', async () => {
 let calls = 0; configureTeachingInterface({ async request() { calls++; return ready(); } });
 const response = await getTeachingInterface(ctx('minor-cbse')).requestProjectGuidance({ input: 'Career scenario', audience: 'adult' });
 assert.equal(response.status, 'blocked'); assert.equal(calls, 0);
 const db = JSON.parse(memory.get('visionary_workspace_v2')); db.people.find(person => person.id === 'demo-adult').ageBand = 'unknown'; memory.set('visionary_workspace_v2', JSON.stringify(db));
 assert.equal((await getTeachingInterface(ctx()).requestExplanation({ input: 'Adult scenario', audience: 'adult' })).status, 'blocked');
 assert.throws(() => getTeachingInterface({ ...ctx(), personId: 'demo-parent' }), /access/);
});

test('teaching cancellation rejects promptly and never substitutes a local answer', async () => {
 const controller = new AbortController(); let resolve;
 configureTeachingInterface({ request: () => new Promise(done => { resolve = done; }) });
 const pending = getTeachingInterface({ ...ctx(), signal: controller.signal }).requestFeedback({ input: 'Submitted check' });
 controller.abort(); await assert.rejects(pending, { name: 'AbortError' }); resolve(ready());
 assert.throws(() => getTeachingInterface({ ...ctx(), signal: controller.signal }), { name: 'AbortError' });
});

test('teaching validates question/representation payloads before UI consumption', async () => {
 const api = getTeachingInterface(ctx());
 for (const malformed of [
  { ...ready(), question: { id: 'q', prompt: 'Check', options: [], answerIndex: 0, source: 'database' } },
  { ...ready(), question: { id: 'q', prompt: 'Check', options: ['A', 'B'], answerIndex: 2, source: 'database' } },
  { ...ready(), representations: [{ id: 'visual', kind: 'cube' }] },
  { ...ready(), status: 'not_connected', question: { id: 'q', prompt: 'Check', options: ['A', 'B'], answerIndex: 0, source: 'database' } },
 ]) {
  configureTeachingInterface({ async request() { return malformed; } });
  await assert.rejects(api.requestPracticeQuestion({ input: 'Next check' }), /incomplete|Unavailable teaching/);
 }
 configureTeachingInterface({ async request() { return { ...ready(), question: { id: 'q', prompt: 'Fixture question', options: ['A', 'B'], answerIndex: 0, source: 'database' } }; } });
 assert.equal((await api.requestPracticeQuestion({ input: 'Next check' })).question.id, 'q');
});
