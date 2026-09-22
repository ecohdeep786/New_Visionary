import type { Locale, RequestContext } from '../domain/workspace.ts';
import { workspaceIdentity } from './workspaceService.ts';
import { getJourney } from './journeys.ts';

export type ContentStatus = 'sample' | 'provisional' | 'official';
export interface ContentSelection { board: string; classLevel: string; subject: string }
export interface ContentQuestion { id: string; prompt: string; options: string[]; answerIndex: number; source: 'authored-sample' | 'database' }
export interface RepresentationDescriptor { id: string; kind: 'text' | 'diagram' | 'cube' | 'number-line' | 'scene'; alternative: string; assetId?: string }
export interface ContentTextbook { id: string; title: string; chapterIds: string[] }
export interface ContentChapter { id: string; title: string; textbookId: string; topicIds: string[]; status: ContentStatus }
export interface ContentTopic { id: string; title: string; chapterId: string; conceptIds: string[]; status: ContentStatus }
export interface ContentConcept { id: string; title: string; topicId: string; prerequisiteIds: string[]; status: ContentStatus; officialId?: string; explanation?: string; check?: ContentQuestion; practice?: ContentQuestion[]; project?: { title: string; brief: string }; representations: RepresentationDescriptor[]; audience?: 'general' | 'adult'; locale?: Locale }
export interface ContentSyllabus extends ContentSelection { id: string; status: ContentStatus; textbooks: ContentTextbook[]; chapters: ContentChapter[] }
export interface ContentGraph { syllabus: ContentSyllabus; topics: ContentTopic[]; concepts: ContentConcept[] }
export interface ContentDataGap extends ContentSelection { user_id: string; timestamp: string; syllabusId: string; resolvedAt?: string }
/** Implement this boundary with the syllabus API. A miss is null, not invented curriculum. */
export interface ContentRepositoryAdapter { getSyllabus(selection: ContentSelection, ctx: RequestContext): Promise<ContentGraph | null>; getConcept?(conceptId: string, ctx: RequestContext): Promise<ContentConcept | null> }
export interface ContentRepository {
 getSyllabus(board: string, classLevel: string, subject: string): Promise<ContentSyllabus>;
 getChapters(syllabusId: string): Promise<ContentChapter[]>;
 getTopics(chapterId: string): Promise<ContentTopic[]>;
 getConcepts(topicId: string): Promise<ContentConcept[]>;
 getConcept(conceptId: string): Promise<ContentConcept | null>;
 renameProvisional(id: string, title: string): Promise<void>;
 mapProvisional(provisionalId: string, officialId: string): Promise<void>;
 getDataGaps(): Promise<ContentDataGap[]>;
}

export const SAMPLE_SELECTION: ContentSelection = { board: 'Sample', classLevel: '6', subject: 'Mathematics' };
const KEY = 'visionary_content_v1';
interface ContentStore { version: 1; spaces: Record<string, { graphs: ContentGraph[]; aliases: Record<string, string>; gaps: ContentDataGap[] }> }
let adapter: ContentRepositoryAdapter | null = null;
export function configureContentRepository(next: ContentRepositoryAdapter | null) { adapter = next; }
function check(ctx: RequestContext) { if (ctx.signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); workspaceIdentity(ctx); }
function read(): ContentStore {
 const raw = localStorage.getItem(KEY); if (!raw) return { version: 1, spaces: {} };
 try { const db = JSON.parse(raw); if (db.version !== 1 || !db.spaces) throw Error(); return db; }
 catch { throw new Error('Saved curriculum could not be read. Existing records have not been changed.'); }
}
function write(db: ContentStore, ctx: RequestContext) {
 check(ctx);
 try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { throw new Error('Curriculum changes could not be saved on this device. Your previous records are unchanged.'); }
 if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('visionary:content-change'));
}
function space(db: ContentStore, ctx: RequestContext) { return db.spaces[ctx.workspaceId] ??= { graphs: [], aliases: {}, gaps: [] }; }
function selection(board: string, classLevel: string, subject: string): ContentSelection { return { board: board.trim().slice(0, 100) || 'Not specified', classLevel: classLevel.trim().slice(0, 100) || 'Not specified', subject: subject.trim().slice(0, 100) || 'My subject' }; }
function same(a: ContentSelection, b: ContentSelection) { return a.board === b.board && a.classLevel === b.classLevel && a.subject === b.subject; }
function provisional(query: ContentSelection): ContentGraph {
 const id = `provisional:${encodeURIComponent(JSON.stringify(query))}`;
 const book = `${id}:textbook`; const chapter = `${id}:chapter:1`; const topic = `${id}:topic:1`; const concept = `${id}:concept:1`;
 return { syllabus: { ...query, id, status: 'provisional', textbooks: [{ id: book, title: 'Your learning outline', chapterIds: [chapter] }], chapters: [{ id: chapter, textbookId: book, title: 'Chapter 1', topicIds: [topic], status: 'provisional' }] }, topics: [{ id: topic, chapterId: chapter, title: 'Topic 1', conceptIds: [concept], status: 'provisional' }], concepts: [{ id: concept, topicId: topic, title: 'Concept 1', prerequisiteIds: [], status: 'provisional', representations: [] }] };
}
/** Two already-authored activities, explicitly sample-only; not a curriculum or model generator. */
function sample(locale: Locale): ContentGraph {
 const syllabus: ContentSyllabus = { ...SAMPLE_SELECTION, id: 'sample:math', status: 'sample', textbooks: [{ id: 'sample:book', title: 'Authored sample activities', chapterIds: ['sample:fractions', 'sample:geometry'] }], chapters: [] };
 const topics: ContentTopic[] = []; const concepts: ContentConcept[] = [];
 for (const [journeyId, chapterId] of [['fractions', 'sample:fractions'], ['cube', 'sample:geometry']]) {
  const journey = getJourney(journeyId!, locale); const topicId = `${chapterId}:topic`; const conceptId = `sample:${journeyId}:concept`;
  syllabus.chapters.push({ id: chapterId!, textbookId: 'sample:book', title: journey.title, topicIds: [topicId], status: 'sample' });
  topics.push({ id: topicId, chapterId: chapterId!, title: journey.title, conceptIds: [conceptId], status: 'sample' });
  const questions: ContentQuestion[] = journey.questions.map((q, i) => ({ id: `${conceptId}:q:${i}`, prompt: q.prompt, options: q.options, answerIndex: q.answer, source: 'authored-sample' }));
  concepts.push({ id: conceptId, title: journey.title, topicId, prerequisiteIds: [], status: 'sample', explanation: journey.explanation, check: questions[0], practice: questions.slice(1), project: { title: journey.project, brief: journey.projectBrief }, representations: [{ id: `${conceptId}:visual`, kind: journeyId === 'cube' ? 'cube' : 'number-line', alternative: journey.explanation }], audience: 'general', locale });
 }
 return { syllabus, topics, concepts };
}
function validateGraph(graph: ContentGraph) {
 const chapters = graph.syllabus.chapters; const topics = graph.topics; const concepts = graph.concepts;
 const ids = [graph.syllabus.id, ...graph.syllabus.textbooks.map(b => b.id), ...chapters.map(c => c.id), ...topics.map(t => t.id), ...concepts.map(c => c.id)];
 if (new Set(ids).size !== ids.length || ids.some(id => !id)) throw new Error('The curriculum response contains invalid identifiers.');
 if (chapters.some(c => !graph.syllabus.textbooks.some(b => b.id === c.textbookId) || c.topicIds.some(id => !topics.some(t => t.id === id && t.chapterId === c.id))) || topics.some(t => !chapters.some(c => c.id === t.chapterId) || t.conceptIds.some(id => !concepts.some(c => c.id === id && c.topicId === t.id))) || concepts.some(c => !topics.some(t => t.id === c.topicId))) throw new Error('The curriculum response contains an incomplete hierarchy.');
}
function eligible(ctx: RequestContext, concept: ContentConcept) { return concept.audience !== 'adult' || workspaceIdentity(ctx).person.ageBand === 'adult'; }

export function getContentRepository(ctx: RequestContext): ContentRepository {
 check(ctx);
 const conceptFrom = (db: ContentStore, id: string) => space(db, ctx).graphs.flatMap(g => g.concepts).find(c => c.id === id);
 return {
  async getSyllabus(board, classLevel, subject) {
   check(ctx); const query = selection(board, classLevel, subject); const remote = adapter;
   let graph = remote ? await remote.getSyllabus(query, ctx) : same(query, SAMPLE_SELECTION) ? sample(ctx.locale) : null;
   check(ctx); const db = read(); const current = space(db, ctx); const existing = current.graphs.find(g => same(g.syllabus, query));
   if (graph) {
    validateGraph(graph); graph = structuredClone(graph);
    if (remote && graph.syllabus.status !== 'official') throw new Error('Connected curriculum must declare its official source.');
    // Keep provisional objects addressable; the backend supplies an explicit mapping later.
    const index = current.graphs.findIndex(g => g.syllabus.id === graph!.syllabus.id);
    if (index >= 0) current.graphs[index] = graph; else current.graphs.push(graph);
    if (graph.syllabus.status === 'official') for (const gap of current.gaps.filter(g => same(g, query))) gap.resolvedAt ??= new Date().toISOString();
    write(db, ctx); return structuredClone(graph.syllabus);
   }
   if (existing) return structuredClone(existing.syllabus);
   graph = provisional(query); current.graphs.push(graph); current.gaps.push({ ...query, user_id: ctx.personId, timestamp: new Date().toISOString(), syllabusId: graph.syllabus.id });
   write(db, ctx); return structuredClone(graph.syllabus);
  },
  async getChapters(syllabusId) { check(ctx); const graph = space(read(), ctx).graphs.find(g => g.syllabus.id === syllabusId); if (!graph) throw new Error('Syllabus unavailable in this workspace.'); return structuredClone(graph.syllabus.chapters); },
  async getTopics(chapterId) { check(ctx); const graph = space(read(), ctx).graphs.find(g => g.syllabus.chapters.some(c => c.id === chapterId)); if (!graph) throw new Error('Chapter unavailable in this workspace.'); return structuredClone(graph.topics.filter(t => t.chapterId === chapterId)); },
  async getConcepts(topicId) { check(ctx); const graph = space(read(), ctx).graphs.find(g => g.topics.some(t => t.id === topicId)); if (!graph) throw new Error('Topic unavailable in this workspace.'); return structuredClone(graph.concepts.filter(c => c.topicId === topicId && eligible(ctx, c))); },
  async getConcept(conceptId) {
   check(ctx); const db = read(); const officialId = space(db, ctx).aliases[conceptId]; const id = officialId || conceptId;
   let concept = conceptFrom(db, id);
   if (!concept && adapter?.getConcept) concept = await adapter.getConcept(id, ctx) ?? undefined;
   check(ctx); if (!concept || !eligible(ctx, concept)) return null;
   return structuredClone(officialId ? { ...concept, id: conceptId, officialId } : concept);
  },
  async renameProvisional(id, title) {
   check(ctx); const name = title.trim().slice(0, 120); if (!name) throw new Error('Enter a name or keep the numbered placeholder.');
   const db = read(); const graphs = space(db, ctx).graphs;
   const item = graphs.flatMap(g => [...g.syllabus.chapters, ...g.topics, ...g.concepts]).find(c => c.id === id && c.status === 'provisional');
   if (!item) throw new Error('Only your provisional chapters, topics and concepts can be renamed.'); item.title = name; write(db, ctx);
  },
  async mapProvisional(provisionalId, officialId) {
   check(ctx); const db = read(); const previous = conceptFrom(db, provisionalId); let next = conceptFrom(db, officialId);
   if (!next && adapter?.getConcept) next = await adapter.getConcept(officialId, ctx) ?? undefined;
   check(ctx);
   if (!previous || previous.status !== 'provisional' || !next || next.status !== 'official' || !eligible(ctx, next)) throw new Error('Both an owned provisional concept and an available official concept are required.');
   // Only an alias is added: progress, sessions and artifacts retain their original IDs.
   const fresh = read(); space(fresh, ctx).aliases[provisionalId] = officialId; write(fresh, ctx);
  },
  async getDataGaps() { check(ctx); return structuredClone(space(read(), ctx).gaps); },
 };
}
