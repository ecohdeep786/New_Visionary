import type { Locale, RequestContext } from '../domain/workspace.ts';
import { workspaceIdentity } from './workspaceService.ts';
import { getJourney } from './journeys.ts';

export type ContentStatus = 'sample' | 'provisional' | 'official';
export interface ContentProvenance { provider: string; sourceId: string; version: string }
export interface ContentSelection { board: string; classLevel: string; subject: string }
export interface ContentQuestion { id: string; prompt: string; options: string[]; answerIndex: number; source: 'authored-sample' | 'database' }
export interface RepresentationDescriptor { id: string; kind: 'text' | 'diagram' | 'cube' | 'number-line' | 'scene'; alternative: string; assetId?: string }
export interface ContentTextbook { id: string; title: string; chapterIds: string[] }
export interface ContentChapter { id: string; title: string; textbookId: string; topicIds: string[]; status: ContentStatus }
export interface ContentTopic { id: string; title: string; chapterId: string; conceptIds: string[]; status: ContentStatus }
export interface ContentConcept { id: string; title: string; topicId: string; prerequisiteIds: string[]; status: ContentStatus; officialId?: string; explanation?: string; check?: ContentQuestion; practice?: ContentQuestion[]; project?: { title: string; brief: string }; representations: RepresentationDescriptor[]; audience?: 'general' | 'adult'; locale?: Locale; availableLocales?: Locale[]; languageUnavailable?: boolean; provenance?: ContentProvenance }
export interface ContentSyllabus extends ContentSelection { id: string; status: ContentStatus; textbooks: ContentTextbook[]; chapters: ContentChapter[]; contentLocale?: Locale; availableLocales?: Locale[]; provenance?: ContentProvenance }
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
 resolveProgressId(conceptId: string): Promise<string>;
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
// An opaque stable key avoids leaking free-form selection labels through object IDs.
// This is an identifier, not encryption or an authorization boundary. Existing IDs are retained.
function selectionKey(query: ContentSelection) {
 let hash = 14695981039346656037n;
 for (const byte of new TextEncoder().encode(JSON.stringify(query))) hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 1099511628211n);
 return hash.toString(16).padStart(16, '0');
}
async function abortable<T>(request: Promise<T>, signal?: AbortSignal): Promise<T> {
 if (!signal) return request;
 if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
 let cancel: (() => void) | undefined;
 try { return await Promise.race([request, new Promise<never>((_, reject) => { cancel = () => reject(new DOMException('Cancelled', 'AbortError')); signal.addEventListener('abort', cancel, { once: true }); })]); }
 finally { if (cancel) signal.removeEventListener('abort', cancel); }
}
function provisional(query: ContentSelection): ContentGraph {
 const id = `provisional:${selectionKey(query)}`;
 const book = `${id}:textbook`; const chapter = `${id}:chapter:1`; const topic = `${id}:topic:1`; const concept = `${id}:concept:1`;
 return { syllabus: { ...query, id, status: 'provisional', availableLocales: [], textbooks: [{ id: book, title: 'Your learning outline', chapterIds: [chapter] }], chapters: [{ id: chapter, textbookId: book, title: 'Chapter 1', topicIds: [topic], status: 'provisional' }] }, topics: [{ id: topic, chapterId: chapter, title: 'Topic 1', conceptIds: [concept], status: 'provisional' }], concepts: [{ id: concept, topicId: topic, title: 'Concept 1', prerequisiteIds: [], status: 'provisional', representations: [], availableLocales: [] }] };
}
/** Two already-authored activities, explicitly sample-only; not a curriculum or model generator. */
function sample(locale: Locale): ContentGraph {
 const syllabus: ContentSyllabus = { ...SAMPLE_SELECTION, id: 'sample:math', status: 'sample', contentLocale: locale, availableLocales: ['en', 'hi', 'bn'], provenance: { provider: 'Visionary authored samples', sourceId: 'sample:math', version: '1' }, textbooks: [{ id: 'sample:book', title: 'Authored sample activities', chapterIds: ['sample:fractions', 'sample:geometry'] }], chapters: [] };
 const topics: ContentTopic[] = []; const concepts: ContentConcept[] = [];
 for (const [journeyId, chapterId] of [['fractions', 'sample:fractions'], ['cube', 'sample:geometry']]) {
  const journey = getJourney(journeyId!, locale); const topicId = `${chapterId}:topic`; const conceptId = `sample:${journeyId}:concept`;
  syllabus.chapters.push({ id: chapterId!, textbookId: 'sample:book', title: journey.title, topicIds: [topicId], status: 'sample' });
  topics.push({ id: topicId, chapterId: chapterId!, title: journey.title, conceptIds: [conceptId], status: 'sample' });
  const questions: ContentQuestion[] = journey.questions.map((q, i) => ({ id: `${conceptId}:q:${i}`, prompt: q.prompt, options: q.options, answerIndex: q.answer, source: 'authored-sample' }));
  concepts.push({ id: conceptId, title: journey.title, topicId, prerequisiteIds: [], status: 'sample', explanation: journey.explanation, check: questions[0], practice: questions.slice(1), project: { title: journey.project, brief: journey.projectBrief }, representations: [{ id: `${conceptId}:visual`, kind: journeyId === 'cube' ? 'cube' : 'number-line', alternative: journey.explanation }], audience: 'general', locale, availableLocales: ['en', 'hi', 'bn'], provenance: syllabus.provenance });
 }
 return { syllabus, topics, concepts };
}
export function validateContentQuestion(question: ContentQuestion) {
 if (!question || typeof question.id !== 'string' || !question.id.trim() || typeof question.prompt !== 'string' || !question.prompt.trim() || !Array.isArray(question.options) || question.options.length < 2 || question.options.some(option => typeof option !== 'string' || !option.trim()) || !Number.isInteger(question.answerIndex) || question.answerIndex < 0 || question.answerIndex >= question.options.length || !['authored-sample', 'database'].includes(question.source)) throw new Error('The content service returned an incomplete question. Your saved work is unchanged.');
}
function validLocales(locales: unknown): locales is Locale[] { return Array.isArray(locales) && locales.length > 0 && new Set(locales).size === locales.length && locales.every(locale => ['en', 'hi', 'bn'].includes(locale)); }
function validProvenance(value: unknown): value is ContentProvenance { const source = value as ContentProvenance | undefined; return Boolean(source && typeof source.provider === 'string' && source.provider.trim() && typeof source.sourceId === 'string' && source.sourceId.trim() && typeof source.version === 'string' && source.version.trim()); }
function validateConcept(concept: ContentConcept) {
 if (!concept || typeof concept.id !== 'string' || !concept.id.trim() || typeof concept.title !== 'string' || !concept.title.trim() || typeof concept.topicId !== 'string' || !Array.isArray(concept.prerequisiteIds) || concept.prerequisiteIds.some(id => typeof id !== 'string' || !id) || !['sample', 'provisional', 'official'].includes(concept.status) || !Array.isArray(concept.representations) || concept.representations.some(item => !item || typeof item.id !== 'string' || typeof item.alternative !== 'string' || !['text', 'diagram', 'cube', 'number-line', 'scene'].includes(item.kind)) || (concept.audience !== undefined && !['general', 'adult'].includes(concept.audience)) || (concept.locale !== undefined && !['en', 'hi', 'bn'].includes(concept.locale))) throw new Error('The content service returned an incomplete concept. Your saved work is unchanged.');
 if (concept.explanation !== undefined && typeof concept.explanation !== 'string') throw new Error('The concept explanation is unavailable.');
 if (concept.project !== undefined && (!concept.project || typeof concept.project.title !== 'string' || typeof concept.project.brief !== 'string')) throw new Error('The project description is unavailable.');
 if (concept.check !== undefined) validateContentQuestion(concept.check);
 if (concept.practice !== undefined) { if (!Array.isArray(concept.practice)) throw new Error('Practice questions are unavailable.'); concept.practice.forEach(validateContentQuestion); }
 if (concept.availableLocales !== undefined && !(concept.status === 'provisional' && Array.isArray(concept.availableLocales) && concept.availableLocales.length === 0) && !validLocales(concept.availableLocales)) throw new Error('The content service returned incomplete language availability.');
 if (concept.provenance !== undefined && !validProvenance(concept.provenance)) throw new Error('The content service returned incomplete source details.');
}
function validateGraph(graph: ContentGraph, connected: boolean) {
 if (!graph?.syllabus || !Array.isArray(graph.syllabus.textbooks) || !Array.isArray(graph.syllabus.chapters) || !Array.isArray(graph.topics) || !Array.isArray(graph.concepts)) throw new Error('The curriculum response contains an incomplete hierarchy.');
 const chapters = graph.syllabus.chapters; const topics = graph.topics; const concepts = graph.concepts;
 const ids = [graph.syllabus.id, ...graph.syllabus.textbooks.map(b => b.id), ...chapters.map(c => c.id), ...topics.map(t => t.id), ...concepts.map(c => c.id)];
 if (new Set(ids).size !== ids.length || ids.some(id => typeof id !== 'string' || !id.trim())) throw new Error('The curriculum response contains invalid identifiers.');
 if (graph.syllabus.textbooks.some(b => !Array.isArray(b.chapterIds) || b.chapterIds.some(id => !chapters.some(c => c.id === id && c.textbookId === b.id))) || chapters.some(c => !Array.isArray(c.topicIds) || !graph.syllabus.textbooks.some(b => b.id === c.textbookId && b.chapterIds.includes(c.id)) || c.topicIds.some(id => !topics.some(t => t.id === id && t.chapterId === c.id))) || topics.some(t => !Array.isArray(t.conceptIds) || !chapters.some(c => c.id === t.chapterId && c.topicIds.includes(t.id)) || t.conceptIds.some(id => !concepts.some(c => c.id === id && c.topicId === t.id))) || concepts.some(c => !topics.some(t => t.id === c.topicId && t.conceptIds.includes(c.id)))) throw new Error('The curriculum response contains an incomplete hierarchy.');
 concepts.forEach(validateConcept);
 if (connected && (graph.syllabus.status !== 'official' || !validProvenance(graph.syllabus.provenance) || !validLocales(graph.syllabus.availableLocales) || !graph.syllabus.contentLocale || !graph.syllabus.availableLocales.includes(graph.syllabus.contentLocale) || concepts.some(concept => concept.status !== 'official' || concept.locale !== graph.syllabus.contentLocale || !validLocales(concept.availableLocales) || !concept.availableLocales.includes(concept.locale!)))) throw new Error('Connected curriculum needs a source version and explicit language availability. Your saved work is unchanged.');
}
function eligible(ctx: RequestContext, concept: ContentConcept) { return concept.audience !== 'adult' || workspaceIdentity(ctx).person.ageBand === 'adult'; }
function preferredGraph(graphs: ContentGraph[], locale: Locale) { return graphs.find(graph => graph.syllabus.contentLocale === locale) ?? graphs.find(graph => graph.syllabus.status === 'official') ?? graphs[0]; }
function forLanguage(concept: ContentConcept, syllabus: ContentSyllabus, locale: Locale): ContentConcept {
 const sourceLocale = concept.locale ?? syllabus.contentLocale;
 const availableLocales = concept.availableLocales ?? syllabus.availableLocales;
 const provenance = concept.provenance ?? syllabus.provenance;
 if (concept.status !== 'official' || sourceLocale === locale) return { ...concept, availableLocales, provenance };
 // Keep identity and prerequisites; never present another language's authored teaching as a translation.
 const { explanation: _explanation, check: _check, practice: _practice, project: _project, ...metadata } = concept;
 void _explanation; void _check; void _practice; void _project;
 return { ...metadata, representations: [], locale: sourceLocale, availableLocales, provenance, languageUnavailable: true };
}

export function getContentRepository(ctx: RequestContext): ContentRepository {
 check(ctx);
 const graphForConcept = (db: ContentStore, id: string) => preferredGraph(space(db, ctx).graphs.filter(g => g.concepts.some(c => c.id === id)), ctx.locale);
 const conceptFrom = (db: ContentStore, id: string) => graphForConcept(db, id)?.concepts.find(c => c.id === id);
 return {
  async getSyllabus(board, classLevel, subject) {
   check(ctx); const query = selection(board, classLevel, subject); const remote = adapter;
   let graph = remote ? await abortable(remote.getSyllabus(query, ctx), ctx.signal) : same(query, SAMPLE_SELECTION) ? sample(ctx.locale) : null;
   check(ctx); const db = read(); const current = space(db, ctx); const matching = current.graphs.filter(g => same(g.syllabus, query)); const existing = preferredGraph(matching, ctx.locale);
   if (graph) {
    validateGraph(graph, Boolean(remote)); graph = structuredClone(graph);
    if (!same(graph.syllabus, query)) throw new Error('The curriculum response does not match the requested selection.');
    // Keep provisional objects addressable; the backend supplies an explicit mapping later.
    const index = current.graphs.findIndex(g => g.syllabus.id === graph!.syllabus.id && g.syllabus.contentLocale === graph!.syllabus.contentLocale);
    if (index >= 0) current.graphs[index] = graph; else current.graphs.push(graph);
    if (graph.syllabus.status === 'official') for (const gap of current.gaps.filter(g => same(g, query))) gap.resolvedAt ??= new Date().toISOString();
    write(db, ctx); return structuredClone(graph.syllabus);
   }
   if (existing) return structuredClone(existing.syllabus);
   graph = provisional(query); current.graphs.push(graph); current.gaps.push({ ...query, user_id: ctx.personId, timestamp: new Date().toISOString(), syllabusId: graph.syllabus.id });
   write(db, ctx); return structuredClone(graph.syllabus);
  },
  async getChapters(syllabusId) { check(ctx); let graph = preferredGraph(space(read(), ctx).graphs.filter(g => g.syllabus.id === syllabusId), ctx.locale); if (!graph) throw new Error('Syllabus unavailable in this workspace.'); if (graph.syllabus.id === 'sample:math' && graph.syllabus.status === 'sample') graph = sample(ctx.locale); return structuredClone(graph.syllabus.chapters); },
  async getTopics(chapterId) { check(ctx); let graph = preferredGraph(space(read(), ctx).graphs.filter(g => g.syllabus.chapters.some(c => c.id === chapterId)), ctx.locale); if (!graph) throw new Error('Chapter unavailable in this workspace.'); if (graph.syllabus.id === 'sample:math' && graph.syllabus.status === 'sample') graph = sample(ctx.locale); return structuredClone(graph.topics.filter(t => t.chapterId === chapterId)); },
  async getConcepts(topicId) { check(ctx); let graph = preferredGraph(space(read(), ctx).graphs.filter(g => g.topics.some(t => t.id === topicId)), ctx.locale); if (!graph) throw new Error('Topic unavailable in this workspace.'); if (graph.syllabus.id === 'sample:math' && graph.syllabus.status === 'sample') graph = sample(ctx.locale); return structuredClone(graph.concepts.filter(c => c.topicId === topicId && eligible(ctx, c)).map(c => forLanguage(c, graph!.syllabus, ctx.locale))); },
  async getConcept(conceptId) {
   check(ctx); const db = read(); const officialId = space(db, ctx).aliases[conceptId]; const id = officialId || conceptId;
   const storedGraph = graphForConcept(db, id);
   let concept = conceptFrom(db, id);
   if (concept?.status === 'sample') concept = sample(ctx.locale).concepts.find(c => c.id === id) ?? concept;
   if (!concept && adapter?.getConcept) {
    concept = await abortable(adapter.getConcept(id, ctx), ctx.signal) ?? undefined;
    if (concept && concept.status === 'official' && (!validProvenance(concept.provenance) || !validLocales(concept.availableLocales) || !concept.locale || !concept.availableLocales.includes(concept.locale))) throw new Error('Connected concept needs a source version and explicit language availability.');
   }
   check(ctx); if (!concept || !eligible(ctx, concept)) return null;
   validateConcept(concept); if (concept.id !== id) throw new Error('The content response does not match the requested concept.');
   const localized = forLanguage(concept, storedGraph?.syllabus ?? { id, status: concept.status, board: '', classLevel: '', subject: '', textbooks: [], chapters: [] }, ctx.locale);
   return structuredClone(officialId ? { ...localized, id: conceptId, officialId } : localized);
  },
  async resolveProgressId(conceptId) {
   check(ctx); const matches = Object.entries(space(read(), ctx).aliases).filter(([, official]) => official === conceptId).map(([provisionalId]) => provisionalId);
   if (matches.length > 1) throw new Error('Several provisional concepts map to this official concept. Review their progress before continuing.');
   return matches[0] || conceptId;
  },
  async renameProvisional(id, title) {
   check(ctx); const name = title.trim().slice(0, 120); if (!name) throw new Error('Enter a name or keep the numbered placeholder.');
   const db = read(); const graphs = space(db, ctx).graphs;
   const item = graphs.flatMap(g => [...g.syllabus.chapters, ...g.topics, ...g.concepts]).find(c => c.id === id && c.status === 'provisional');
   if (!item) throw new Error('Only your provisional chapters, topics and concepts can be renamed.'); item.title = name; write(db, ctx);
  },
  async mapProvisional(provisionalId, officialId) {
   check(ctx); const db = read(); const previous = conceptFrom(db, provisionalId); let next = conceptFrom(db, officialId);
   if (!next && adapter?.getConcept) {
    next = await abortable(adapter.getConcept(officialId, ctx), ctx.signal) ?? undefined;
    if (next && (!validProvenance(next.provenance) || !validLocales(next.availableLocales) || !next.locale || !next.availableLocales.includes(next.locale))) throw new Error('Connected concept needs a source version and explicit language availability.');
   }
   check(ctx);
   if (!previous || previous.status !== 'provisional' || !next || next.status !== 'official' || !eligible(ctx, next)) throw new Error('Both an owned provisional concept and an available official concept are required.');
   validateConcept(next); if (next.id !== officialId) throw new Error('The official concept does not match the requested identifier.');
   // Only an alias is added: progress, sessions and artifacts retain their original IDs.
   const fresh = read(); space(fresh, ctx).aliases[provisionalId] = officialId; write(fresh, ctx);
  },
  async getDataGaps() { check(ctx); return structuredClone(space(read(), ctx).gaps); },
 };
}
