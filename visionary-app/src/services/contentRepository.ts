import type { Locale, RequestContext } from '../domain/workspace.ts';
import { workspaceIdentity } from './workspaceService.ts';
import { getJourney } from './journeys.ts';

export type ContentStatus = 'sample' | 'provisional' | 'official';
export interface ContentProvenance { provider: string; sourceId: string; version: string }
export interface ContentSelection { board: string; classLevel: string; subject: string }
export interface ContentQuestion { id: string; prompt: string; options: string[]; answerIndex: number; source: 'authored-sample' | 'database' }
export interface ContentCriterion { id: string; label: string; prompt: string }
export interface RepresentationDescriptor { id: string; kind: 'text' | 'diagram' | 'cube' | 'number-line' | 'scene'; alternative: string; assetId?: string; numberLine?:{minimum:number;maximum:number;divisions:number;initial:number}; series?:{label:string;value:number}[] }
export interface ContentTextbook { id: string; title: string; chapterIds: string[] }
export interface ContentChapter { id: string; title: string; textbookId: string; topicIds: string[]; status: ContentStatus }
export interface ContentTopic { id: string; title: string; chapterId: string; conceptIds: string[]; status: ContentStatus }
export interface ContentConcept { id: string; title: string; topicId: string; prerequisiteIds: string[]; status: ContentStatus; officialId?: string; explanation?: string; check?: ContentQuestion; practice?: ContentQuestion[]; project?: { title: string; brief: string; criteria?: ContentCriterion[] }; representations: RepresentationDescriptor[]; audience?: 'general' | 'adult'; locale?: Locale; availableLocales?: Locale[]; languageUnavailable?: boolean; provenance?: ContentProvenance }
export interface ContentSyllabus extends ContentSelection { id: string; status: ContentStatus; textbooks: ContentTextbook[]; chapters: ContentChapter[]; contentLocale?: Locale; availableLocales?: Locale[]; provenance?: ContentProvenance }
export interface CurriculumMapping {
 fromConceptId:string; fromSelection:ContentSelection; fromSource:ContentProvenance;
 disposition:'equivalent'|'archive'; toConceptId?:string; reason:string;
 reviewedBy:string; reviewedAt:string;
}
export interface ContentGraph { syllabus: ContentSyllabus; topics: ContentTopic[]; concepts: ContentConcept[]; continuityMappings?:CurriculumMapping[] }
export interface ContentDataGap extends ContentSelection { user_id: string; timestamp: string; syllabusId: string; resolvedAt?: string }
export type ContentIssueKind = 'explanation' | 'question' | 'representation' | 'translation' | 'source';
export interface ContentIssue { id: string; conceptId: string; kind: ContentIssueKind; locale: Locale; sourceId?: string; sourceVersion?: string; createdAt: string; state: 'saved-locally' }
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
 getContentIssues(): Promise<ContentIssue[]>;
 reportIssue(conceptId: string, kind: ContentIssueKind, locale?: Locale): Promise<ContentIssue>;
}

export const SAMPLE_SELECTION: ContentSelection = { board: 'Sample', classLevel: '6', subject: 'Mathematics' };
export const PROFESSIONAL_SAMPLE_SELECTION: ContentSelection = { board: 'Sample', classLevel: 'Professional', subject: 'Data interpretation' };
const KEY = 'visionary_content_v1';
interface ContentStore { version: 1; spaces: Record<string, { graphs: ContentGraph[]; aliases: Record<string, string>; gaps: ContentDataGap[]; issues?: ContentIssue[] }> }
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
function space(db: ContentStore, ctx: RequestContext) {
 const own=db.spaces[ctx.workspaceId] ??= {graphs:[],aliases:{},gaps:[]};
 const aliases=own.aliases;
 if(!aliases||typeof aliases!=='object'||Array.isArray(aliases)||Object.entries(aliases).some(([from,to])=>!from.trim()||typeof to!=='string'||!to.trim())||new Set(Object.values(aliases)).size!==Object.keys(aliases).length)throw Error('Saved curriculum mappings are incomplete or ambiguous. Original records were kept; restore a valid saved copy before retrying.');
 return own;
}
function contentIssues(own: ContentStore['spaces'][string]): ContentIssue[] {
 const issues = own.issues;
 if (issues === undefined) return [];
 const ids = new Set<string>();
 if (!Array.isArray(issues) || issues.some(item => {
  if (!item || typeof item.id !== 'string' || !item.id || ids.has(item.id)) return true;
  ids.add(item.id);
  return typeof item.conceptId !== 'string' || !item.conceptId ||
   !['explanation', 'question', 'representation', 'translation', 'source'].includes(item.kind) ||
   !['en', 'hi', 'bn'].includes(item.locale) || item.state !== 'saved-locally' ||
   typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt)) ||
   (item.sourceId !== undefined && (typeof item.sourceId !== 'string' || !item.sourceId)) ||
   (item.sourceVersion !== undefined && (typeof item.sourceVersion !== 'string' || !item.sourceVersion));
 })) throw new Error('Saved issue reports could not be read. Existing reports have not been changed.');
 return issues;
}
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
function sample(locale: Locale, professional = false): ContentGraph {
 const syllabusId = professional ? 'sample:professional' : 'sample:math';
 const paths = professional ? [['data', 'sample:data']] : [['fractions', 'sample:fractions'], ['cube', 'sample:geometry']];
 const syllabus: ContentSyllabus = { ...(professional ? PROFESSIONAL_SAMPLE_SELECTION : SAMPLE_SELECTION), id: syllabusId, status: 'sample', contentLocale: locale, availableLocales: ['en', 'hi', 'bn'], provenance: { provider: 'Visionary authored samples', sourceId: syllabusId, version: '2' }, textbooks: [{ id: professional ? 'sample:professional:book' : 'sample:book', title: 'Authored sample activities', chapterIds: paths.map(([, chapterId]) => chapterId) }], chapters: [] };
 const topics: ContentTopic[] = []; const concepts: ContentConcept[] = [];
 for (const [journeyId, chapterId] of paths) {
  const journey = getJourney(journeyId!, locale); const topicId = `${chapterId}:topic`; const conceptId = `sample:${journeyId}:concept`;
  syllabus.chapters.push({ id: chapterId!, textbookId: syllabus.textbooks[0]!.id, title: journey.title, topicIds: [topicId], status: 'sample' });
  topics.push({ id: topicId, chapterId: chapterId!, title: journey.title, conceptIds: [conceptId], status: 'sample' });
  const questions: ContentQuestion[] = journey.questions.map((q, i) => ({ id: `${conceptId}:q:${i}`, prompt: q.prompt, options: q.options, answerIndex: q.answer, source: 'authored-sample' }));
  const cubeCriteria: Record<Locale, ContentCriterion[]> = {
   en: [{ id: 'capacity', label: 'Calculate capacity', prompt: 'Show the side length and volume of each box, with cubic units.' }, { id: 'comparison', label: 'Compare the boxes', prompt: 'Explain which box holds more and why.' }, { id: 'safety', label: 'Choose a safe material', prompt: 'Name a material and one safety or practical limitation.' }],
   hi: [{ id: 'capacity', label: 'क्षमता की गणना', prompt: 'हर डिब्बे की भुजा और आयतन घन इकाई में दिखाएँ।' }, { id: 'comparison', label: 'डिब्बों की तुलना', prompt: 'बताएँ कि किस डिब्बे में अधिक सामान आएगा और क्यों।' }, { id: 'safety', label: 'सुरक्षित सामग्री चुनें', prompt: 'एक सामग्री और उसकी एक सुरक्षा या व्यावहारिक सीमा बताएँ।' }],
   bn: [{ id: 'capacity', label: 'ধারণক্ষমতা গণনা', prompt: 'প্রতিটি বাক্সের বাহু ও আয়তন ঘন এককে দেখান।' }, { id: 'comparison', label: 'বাক্স তুলনা', prompt: 'কোন বাক্সে বেশি ধরবে এবং কেন তা ব্যাখ্যা করুন।' }, { id: 'safety', label: 'নিরাপদ উপাদান বেছে নিন', prompt: 'একটি উপাদান এবং একটি নিরাপত্তা বা ব্যবহারিক সীমা লিখুন।' }],
  };
  concepts.push({ id: conceptId, title: journey.title, topicId, prerequisiteIds: [], status: 'sample', explanation: journey.explanation, check: questions[0], practice: questions.slice(1), project: { title: journey.project, brief: journey.projectBrief, ...(journeyId === 'cube' ? { criteria: cubeCriteria[locale] } : {}) }, representations: [{ id: `${conceptId}:visual`, kind: journeyId === 'cube' ? 'cube' : journeyId === 'data' ? 'diagram' : 'number-line', alternative: journey.explanation,...(journeyId==='fractions'?{numberLine:{minimum:0,maximum:1,divisions:8,initial:4}}:journeyId==='data'?{series:[{label:locale==='hi'?'सप्ताह 1':locale==='bn'?'সপ্তাহ 1':'Week 1',value:20},{label:locale==='hi'?'सप्ताह 2':locale==='bn'?'সপ্তাহ 2':'Week 2',value:30},{label:locale==='hi'?'सप्ताह 3':locale==='bn'?'সপ্তাহ 3':'Week 3',value:25}]}:{}) }], audience: professional ? 'adult' : 'general', locale, availableLocales: ['en', 'hi', 'bn'], provenance: syllabus.provenance });
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
 for(const descriptor of concept.representations){
  const line=descriptor.numberLine;
  if(line!==undefined&&(descriptor.kind!=='number-line'||!line||!Number.isFinite(line.minimum)||!Number.isFinite(line.maximum)||line.maximum<=line.minimum||Math.abs(line.minimum)>1e9||Math.abs(line.maximum)>1e9||!Number.isInteger(line.divisions)||line.divisions<2||line.divisions>16||!Number.isInteger(line.initial)||line.initial<0||line.initial>line.divisions))throw new Error('The number line data is unavailable. Your saved content is unchanged.');
  const series=descriptor.series;
  if(series!==undefined&&(descriptor.kind!=='diagram'||!Array.isArray(series)||series.length<2||series.length>12||new Set(series.map(item=>item?.label)).size!==series.length||series.some(item=>!item||typeof item.label!=='string'||!item.label.trim()||item.label.length>100||!Number.isFinite(item.value)||item.value<0||item.value>1e9)))throw new Error('The diagram data is unavailable. Your saved content is unchanged.');
 }
 if (concept.project !== undefined && (!concept.project || typeof concept.project.title !== 'string' || typeof concept.project.brief !== 'string' || (concept.project.criteria !== undefined && (!Array.isArray(concept.project.criteria) || !concept.project.criteria.length || new Set(concept.project.criteria.map(item => item?.id)).size !== concept.project.criteria.length || concept.project.criteria.some(item => !item || typeof item.id !== 'string' || !item.id.trim() || typeof item.label !== 'string' || !item.label.trim() || typeof item.prompt !== 'string' || !item.prompt.trim()))))) throw new Error('The project criteria are unavailable.');
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
 if(graph.continuityMappings!==undefined){
  const mappings=graph.continuityMappings;
  if(graph.syllabus.status!=='official'||!Array.isArray(mappings)||mappings.length>500||mappings.some(item=>!item||typeof item.fromConceptId!=='string'||!item.fromConceptId.trim()||!validProvenance(item.fromSource)||!item.fromSelection||['board','classLevel','subject'].some(key=>typeof item.fromSelection[key as keyof ContentSelection]!=='string'||!item.fromSelection[key as keyof ContentSelection].trim())||!['equivalent','archive'].includes(item.disposition)||typeof item.reason!=='string'||!item.reason.trim()||item.reason.length>2000||typeof item.reviewedBy!=='string'||!item.reviewedBy.trim()||typeof item.reviewedAt!=='string'||!Number.isFinite(Date.parse(item.reviewedAt))||(item.disposition==='equivalent'?typeof item.toConceptId!=='string'||!concepts.some(concept=>concept.id===item.toConceptId&&concept.status==='official'):item.toConceptId!==undefined)))throw Error('Reviewed curriculum mappings are incomplete. Your saved work is unchanged.');
  const keys=mappings.map(item=>JSON.stringify([item.fromConceptId,item.fromSelection.board,item.fromSelection.classLevel,item.fromSelection.subject,item.fromSource.provider,item.fromSource.sourceId,item.fromSource.version]));
  if(new Set(keys).size!==keys.length||new Set(mappings.filter(item=>item.disposition==='equivalent').map(item=>item.toConceptId)).size!==mappings.filter(item=>item.disposition==='equivalent').length)throw Error('Curriculum mappings must be unambiguous and one-to-one. Your saved work is unchanged.');
 }
 if (connected && (graph.syllabus.status !== 'official' || !validProvenance(graph.syllabus.provenance) || !validLocales(graph.syllabus.availableLocales) || !graph.syllabus.contentLocale || !graph.syllabus.availableLocales.includes(graph.syllabus.contentLocale) || concepts.some(concept => concept.status !== 'official' || concept.locale !== graph.syllabus.contentLocale || !validLocales(concept.availableLocales) || !concept.availableLocales.includes(concept.locale!)))) throw new Error('Connected curriculum needs a source version and explicit language availability. Your saved work is unchanged.');
}
function eligible(ctx: RequestContext, concept: ContentConcept) { return concept.audience !== 'adult' || workspaceIdentity(ctx).person.ageBand === 'adult'; }
function preferredGraph(graphs: ContentGraph[], locale: Locale) { return graphs.find(graph => graph.syllabus.contentLocale === locale) ?? graphs.find(graph => graph.syllabus.status === 'official') ?? graphs[0]; }
function conceptGraph(graphs:ContentGraph[],conceptId:string,locale:Locale){
 const matching=graphs.filter(graph=>graph.concepts.some(concept=>concept.id===conceptId));
 const graph=preferredGraph(matching,locale);
 if(!graph)return undefined;
 const origin=(item:ContentGraph)=>item.concepts.find(concept=>concept.id===conceptId)?.provenance??item.syllabus.provenance;
 const prior=origin(graph);
 if(matching.some(item=>{const current=origin(item);return !same(item.syllabus,graph.syllabus)||current?.provider!==prior?.provider||current?.sourceId!==prior?.sourceId||current?.version!==prior?.version;}))throw Error('This concept has an ambiguous curriculum source. Original records were kept; restore a reviewed source with distinct concept identifiers before continuing.');
 return graph;
}
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

/** Owned cached graphs only: never creates provisional content or calls a transport. */
export function getSavedCurriculumGraphs(ctx:RequestContext):ContentGraph[]{
 check(ctx);
 const graphs=space(read(),ctx).graphs;
 graphs.forEach(graph=>validateGraph(graph,graph.syllabus.status==='official'));
 return structuredClone(graphs.map(graph=>({...graph,concepts:graph.concepts.filter(concept=>eligible(ctx,concept))})));
}
export function getSavedConceptOrigin(ctx:RequestContext,conceptId:string){
 const graph=conceptGraph(getSavedCurriculumGraphs(ctx),conceptId,ctx.locale);
 if(!graph)return undefined;
 const concept=graph.concepts.find(item=>item.id===conceptId)!;
 const provenance=concept.provenance||graph.syllabus.provenance;
 return provenance?{selection:{board:graph.syllabus.board,classLevel:graph.syllabus.classLevel,subject:graph.syllabus.subject},provenance:structuredClone(provenance)}:undefined;
}

export function getContentRepository(ctx: RequestContext): ContentRepository {
 check(ctx);
 const graphForConcept = (db: ContentStore, id: string) => conceptGraph(space(db, ctx).graphs,id,ctx.locale);
 const conceptFrom = (db: ContentStore, id: string) => graphForConcept(db, id)?.concepts.find(c => c.id === id);
 return {
  async getSyllabus(board, classLevel, subject) {
   check(ctx); const query = selection(board, classLevel, subject); const remote = adapter;
   let graph = remote ? await abortable(remote.getSyllabus(query, ctx), ctx.signal) : same(query, SAMPLE_SELECTION) ? sample(ctx.locale) : same(query, PROFESSIONAL_SAMPLE_SELECTION) && ctx.role === 'professional' ? sample(ctx.locale, true) : null;
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
  async getChapters(syllabusId) { check(ctx); let graph = preferredGraph(space(read(), ctx).graphs.filter(g => g.syllabus.id === syllabusId), ctx.locale); if (!graph) throw new Error('Syllabus unavailable in this workspace.'); if (graph.syllabus.status === 'sample' && ['sample:math','sample:professional'].includes(graph.syllabus.id)) graph = sample(ctx.locale, graph.syllabus.id === 'sample:professional'); return structuredClone(graph.syllabus.chapters); },
  async getTopics(chapterId) { check(ctx); let graph = preferredGraph(space(read(), ctx).graphs.filter(g => g.syllabus.chapters.some(c => c.id === chapterId)), ctx.locale); if (!graph) throw new Error('Chapter unavailable in this workspace.'); if (graph.syllabus.status === 'sample' && ['sample:math','sample:professional'].includes(graph.syllabus.id)) graph = sample(ctx.locale, graph.syllabus.id === 'sample:professional'); return structuredClone(graph.topics.filter(t => t.chapterId === chapterId)); },
  async getConcepts(topicId) { check(ctx); let graph = preferredGraph(space(read(), ctx).graphs.filter(g => g.topics.some(t => t.id === topicId)), ctx.locale); if (!graph) throw new Error('Topic unavailable in this workspace.'); if (graph.syllabus.status === 'sample' && ['sample:math','sample:professional'].includes(graph.syllabus.id)) graph = sample(ctx.locale, graph.syllabus.id === 'sample:professional'); return structuredClone(graph.concepts.filter(c => c.topicId === topicId && eligible(ctx, c)).map(c => forLanguage(c, graph!.syllabus, ctx.locale))); },
  async getConcept(conceptId) {
   check(ctx); const db = read(); const officialId = space(db, ctx).aliases[conceptId]; const id = officialId || conceptId;
   const storedGraph = graphForConcept(db, id);
   let concept = conceptFrom(db, id);
   if (concept?.status === 'sample') concept = sample(ctx.locale, storedGraph?.syllabus.id === 'sample:professional').concepts.find(c => c.id === id) ?? concept;
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
   const originalAliases=JSON.stringify(space(db,ctx).aliases);
   if (!next && adapter?.getConcept) {
    next = await abortable(adapter.getConcept(officialId, ctx), ctx.signal) ?? undefined;
    if (next && (!validProvenance(next.provenance) || !validLocales(next.availableLocales) || !next.locale || !next.availableLocales.includes(next.locale))) throw new Error('Connected concept needs a source version and explicit language availability.');
   }
   check(ctx);
   if (!previous || previous.status !== 'provisional' || !next || next.status !== 'official' || !eligible(ctx, next)) throw new Error('Both an owned provisional concept and an available official concept are required.');
   validateConcept(next); if (next.id !== officialId) throw new Error('The official concept does not match the requested identifier.');
   // Only an alias is added: progress, sessions and artifacts retain their original IDs.
   const fresh = read();const current=space(fresh,ctx);
   if(JSON.stringify(current.aliases)!==originalAliases||JSON.stringify(conceptFrom(fresh,provisionalId))!==JSON.stringify(previous))throw Error('This curriculum mapping or provisional activity changed while loading. Original records were kept; reload before retrying.');
   if(current.aliases[provisionalId]&&current.aliases[provisionalId]!==officialId)throw Error('This provisional activity is already mapped to another reviewed concept. Keep its mapping and review a separate activity.');
   if(Object.entries(current.aliases).some(([from,to])=>from!==provisionalId&&to===officialId))throw Error('This official concept is already mapped to another provisional activity. Review the existing mapping before continuing.');
   const savedTarget=conceptFrom(fresh,officialId),originalTarget=conceptFrom(db,officialId);
   if(JSON.stringify(savedTarget)!==JSON.stringify(originalTarget))throw Error('The reviewed mapping target changed while loading. Original records were kept; reload before retrying.');
   if(current.aliases[provisionalId]===officialId)return;
   current.aliases[provisionalId] = officialId; write(fresh, ctx);
  },
  async getDataGaps() { check(ctx); return structuredClone(space(read(), ctx).gaps); },
  async getContentIssues() { check(ctx); return structuredClone(contentIssues(space(read(), ctx))); },
  async reportIssue(conceptId, kind, locale = ctx.locale) {
   check(ctx);
   if (!['explanation', 'question', 'representation', 'translation', 'source'].includes(kind) || !['en', 'hi', 'bn'].includes(locale)) throw new Error('Choose a valid content issue and teaching language.');
   const concept = await getContentRepository({ ...ctx, locale }).getConcept(conceptId);
   check(ctx); if (!concept) throw new Error('This concept is unavailable in your workspace. Your report was not saved.');
   const db = read(); const own = space(db, ctx); const issues = contentIssues(own);
   const previous = issues.find(item => item.conceptId === conceptId && item.kind === kind && item.locale === locale && item.sourceId === concept.provenance?.sourceId && item.sourceVersion === concept.provenance?.version);
   if (previous) return structuredClone(previous);
   const issue: ContentIssue = { id: crypto.randomUUID(), conceptId, kind, locale, sourceId: concept.provenance?.sourceId, sourceVersion: concept.provenance?.version, createdAt: new Date().toISOString(), state: 'saved-locally' };
   own.issues = [...issues, issue]; write(db, ctx); return structuredClone(issue);
  },
 };
}
