import type { Locale, RequestContext } from '../domain/workspace.ts';
import type { ContentQuestion, RepresentationDescriptor } from './contentRepository.ts';
import { validateContentQuestion } from './contentRepository.ts';
import { workspaceIdentity } from './workspaceService.ts';

export type TeachingMode = 'explanation' | 'practice' | 'feedback' | 'project';
export interface PromptPacket { input: string; conceptId?: string; sessionId?: string; intent?: 'understand' | 'solve' | 'check' | 'plan' | 'build'; language?: Locale; difficulty?: number; context?: Record<string, unknown>; audience?: 'general' | 'adult'; promptVersion?: string }
export interface TeachingResponse { status: 'ready' | 'not_connected' | 'blocked'; text: string; source: 'adapter' | 'not_connected' | 'safety'; question?: ContentQuestion; representations?: RepresentationDescriptor[]; promptVersion?: string }
export interface TeachingInterface { requestExplanation(packet: PromptPacket): Promise<TeachingResponse>; requestPracticeQuestion(packet: PromptPacket): Promise<TeachingResponse>; requestFeedback(packet: PromptPacket): Promise<TeachingResponse>; requestProjectGuidance(packet: PromptPacket): Promise<TeachingResponse> }
export interface TeachingAdapter { request(mode: TeachingMode, packet: PromptPacket, ctx: RequestContext): Promise<TeachingResponse> }
let adapter: TeachingAdapter | null = null;
/** No model implementation or answer generation is included in this frontend. */
export function configureTeachingInterface(next: TeachingAdapter | null) { adapter = next; }
const crisis = /\b(?:suicid(?:e|al)|kill myself|end my life|hurt myself|self[ -]?harm|want to die)\b|आत्महत्या|खुद को मार|जीना नहीं|खुद को नुकसान|আত্মহত্যা|নিজেকে মার|বাঁচতে চাই না|নিজের ক্ষতি/iu;
export function hasSafetyConcern(input: string) { return crisis.test(input); }
const safetyText: Record<Locale, string> = {
 en: 'Your safety matters. Teaching is paused. If you may hurt yourself or are in immediate danger, contact local emergency services or a trusted person who can stay with you now. This app cannot contact anyone for you. Crisis support is not connected here.',
 hi: 'आपकी सुरक्षा महत्वपूर्ण है। पढ़ाई रोक दी गई है। अगर आप खुद को नुकसान पहुँचा सकते हैं या तत्काल खतरे में हैं, तो स्थानीय आपातकालीन सेवा या किसी भरोसेमंद व्यक्ति से संपर्क करें जो अभी आपके साथ रह सके। यह ऐप आपकी ओर से किसी से संपर्क नहीं कर सकता। यहाँ संकट सहायता सेवा जुड़ी नहीं है।',
 bn: 'আপনার নিরাপত্তা গুরুত্বপূর্ণ। শেখানো আপাতত থামানো হয়েছে। নিজেকে আঘাত করার আশঙ্কা বা তাৎক্ষণিক বিপদ থাকলে স্থানীয় জরুরি পরিষেবা অথবা এখন আপনার পাশে থাকতে পারেন এমন বিশ্বস্ত কারও সঙ্গে যোগাযোগ করুন। এই অ্যাপ আপনার হয়ে কাউকে যোগাযোগ করতে পারে না। এখানে সংকট সহায়তা পরিষেবা যুক্ত নেই।',
};
const ageText: Record<Locale, string> = {
 en: 'This activity is not available for this age profile. Choose a general learning activity.',
 hi: 'यह गतिविधि इस आयु प्रोफ़ाइल के लिए उपलब्ध नहीं है। सामान्य सीखने की गतिविधि चुनें।',
 bn: 'এই বয়সের প্রোফাইলের জন্য এই কার্যকলাপটি উপলব্ধ নয়। সাধারণ শেখার কার্যকলাপ বেছে নিন।',
};
function check(ctx: RequestContext) { if (ctx.signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); return workspaceIdentity(ctx); }
async function abortable<T>(request: Promise<T>, signal?: AbortSignal): Promise<T> {
 if (!signal) return request;
 if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
 let cancel: (() => void) | undefined;
 try { return await Promise.race([request, new Promise<never>((_, reject) => { cancel = () => reject(new DOMException('Cancelled', 'AbortError')); signal.addEventListener('abort', cancel, { once: true }); })]); }
 finally { if (cancel) signal.removeEventListener('abort', cancel); }
}
export function getTeachingInterface(ctx: RequestContext): TeachingInterface {
 check(ctx);
 async function request(mode: TeachingMode, packet: PromptPacket): Promise<TeachingResponse> {
  const identity = check(ctx); const locale = packet?.language ?? ctx.locale;
  if (!packet || typeof packet.input !== 'string' || !['en', 'hi', 'bn'].includes(locale)) throw new Error('Choose a supported teaching language and enter your question.');
  // L1 guards the raw input before L4 sees it. No prompt text is written to telemetry here.
  const contextText = packet.context ? JSON.stringify(packet.context) : '';
  if (hasSafetyConcern(packet.input) || hasSafetyConcern(contextText)) return { status: 'blocked', source: 'safety', text: safetyText[locale] };
  if (packet.audience === 'adult' && identity.person.ageBand !== 'adult') return { status: 'blocked', source: 'safety', text: ageText[locale] };
  const current = adapter;
  if (!current) return { status: 'not_connected', source: 'not_connected', text: 'Visionary Guide’s teaching service is not connected. Your workspace can keep your question and learning progress locally; no model answer has been generated.' };
  const result = await abortable(current.request(mode, structuredClone(packet), ctx), ctx.signal);
  check(ctx);
  if (!result || !['ready', 'not_connected', 'blocked'].includes(result.status) || !['adapter', 'not_connected', 'safety'].includes(result.source) || typeof result.text !== 'string' || !result.text.trim()) throw new Error('The teaching service returned an incomplete response. Your saved work is unchanged.');
  if (result.question !== undefined) validateContentQuestion(result.question);
  if (result.representations !== undefined && (!Array.isArray(result.representations) || result.representations.some(item => !item || typeof item.id !== 'string' || typeof item.alternative !== 'string' || !['text', 'diagram', 'cube', 'number-line', 'scene'].includes(item.kind)))) throw new Error('The teaching service returned an incomplete representation. Your saved work is unchanged.');
  if (result.status !== 'ready' && (result.question || result.representations?.length)) throw new Error('Unavailable teaching responses cannot start an activity.');
  return structuredClone(result);
 }
 return { requestExplanation: p => request('explanation', p), requestPracticeQuestion: p => request('practice', p), requestFeedback: p => request('feedback', p), requestProjectGuidance: p => request('project', p) };
}
