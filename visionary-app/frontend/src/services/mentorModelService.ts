import type { Locale, RequestContext, Role, GuideBlock } from '../domain/workspace.ts';
import type { buildMentorPacket } from './mentorCompanionService.ts';
import { workspaceIdentity } from './workspaceService.ts';
import { hasSafetyConcern } from './teachingInterface.ts';

export type MentorContextPacket = ReturnType<typeof buildMentorPacket>;
export type MentorActionId = 'home' | 'learn' | 'ask' | 'practice' | 'build' | 'classes' | 'progress' | 'prepare' | 'learners' | 'insights' | 'growth' | 'child' | 'reports' | 'connections' | 'career' | 'people' | 'cohorts' | 'curriculum' | 'analytics' | 'settings' | 'privacy';
export interface MentorModelReply {
 status: 'ready'; source: 'connected_model'; locale: Locale; promptVersion: string;
 text: string; actionIds: MentorActionId[];
}
export interface MentorModelAdapter {
 request(input: string, context: MentorContextPacket, request: RequestContext): Promise<MentorModelReply>;
}

let adapter: MentorModelAdapter | null = null;
/** A real authenticated backend may register an adapter later. No model runs in this app. */
export function configureMentorModelAdapter(next: MentorModelAdapter | null) { adapter = next; }
export function isMentorModelConfigured() { return adapter !== null; }

const common = ['home', 'ask', 'settings', 'privacy'] as const;
const allowed: Record<Role, readonly MentorActionId[]> = {
 student: [...common, 'learn', 'practice', 'build', 'classes', 'progress', 'connections'],
 professional: [...common, 'learn', 'practice', 'build', 'classes', 'progress', 'career', 'connections'],
 teacher: [...common, 'prepare', 'classes', 'learners', 'insights', 'growth', 'build', 'connections'],
 parent: [...common, 'child', 'reports', 'connections'],
 organization: [...common, 'people', 'cohorts', 'curriculum', 'analytics', 'connections'],
};
const labels: Record<MentorActionId, Record<Locale, string>> = {
 home:{en:'Open Home',hi:'होम खोलें',bn:'হোম খুলুন'},learn:{en:'Open Learn',hi:'सीखें खोलें',bn:'শেখা খুলুন'},ask:{en:'Open Ask',hi:'पूछें खोलें',bn:'জিজ্ঞাসা খুলুন'},
 practice:{en:'Open Practice',hi:'अभ्यास खोलें',bn:'অভ্যাস খুলুন'},build:{en:'Open Build',hi:'बिल्ड खोलें',bn:'বিল্ড খুলুন'},classes:{en:'Open Classes',hi:'कक्षाएँ खोलें',bn:'ক্লাস খুলুন'},
 progress:{en:'Open Progress',hi:'प्रगति खोलें',bn:'অগ্রগতি খুলুন'},prepare:{en:'Open Prepare',hi:'तैयारी खोलें',bn:'প্রস্তুতি খুলুন'},learners:{en:'Open Learners',hi:'विद्यार्थी खोलें',bn:'শিক্ষার্থীদের খুলুন'},
 insights:{en:'Open Insights',hi:'अंतर्दृष्टि खोलें',bn:'ইনসাইট খুলুন'},growth:{en:'Open Teacher Growth',hi:'शिक्षक विकास खोलें',bn:'শিক্ষক উন্নয়ন খুলুন'},
 child:{en:'Open Children',hi:'बच्चे खोलें',bn:'শিশুদের খুলুন'},reports:{en:'Open Reports',hi:'रिपोर्ट खोलें',bn:'রিপোর্ট খুলুন'},connections:{en:'Open Connections',hi:'संबंध खोलें',bn:'সংযোগ খুলুন'},
 career:{en:'Open Career',hi:'करियर खोलें',bn:'ক্যারিয়ার খুলুন'},people:{en:'Open People',hi:'लोग खोलें',bn:'মানুষ খুলুন'},cohorts:{en:'Open Cohorts',hi:'समूह खोलें',bn:'গোষ্ঠী খুলুন'},
 curriculum:{en:'Open Curriculum',hi:'पाठ्यक्रम खोलें',bn:'পাঠ্যক্রম খুলুন'},analytics:{en:'Open Analytics',hi:'विश्लेषण खोलें',bn:'বিশ্লেষণ খুলুন'},settings:{en:'Open Settings',hi:'सेटिंग खोलें',bn:'সেটিংস খুলুন'},privacy:{en:'Open Privacy',hi:'गोपनीयता खोलें',bn:'গোপনীয়তা খুলুন'},
};

async function abortable<T>(request: Promise<T>, signal?: AbortSignal): Promise<T> {
 if (!signal) return request;
 if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
 let cancel: (() => void) | undefined;
 try { return await Promise.race([request, new Promise<never>((_, reject) => { cancel = () => reject(new DOMException('Cancelled', 'AbortError')); signal.addEventListener('abort', cancel, { once: true }); })]); }
 finally { if (cancel) signal.removeEventListener('abort', cancel); }
}

/** Returns null only when no model adapter is registered. A bad response fails closed. */
export async function requestMentorModelTurn(ctx: RequestContext, input: string, context: MentorContextPacket): Promise<{ text: string; blocks: GuideBlock[]; promptVersion: string } | null> {
 workspaceIdentity(ctx);
 if (ctx.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
 if (hasSafetyConcern(input)) throw new Error('A safety concern must be handled before contacting the mentor model.');
 const current = adapter;
 if (!current) return null;
 const reply = await abortable(current.request(input, structuredClone(context), ctx), ctx.signal);
 workspaceIdentity(ctx);
 if (ctx.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
 if (!reply || reply.status !== 'ready' || reply.source !== 'connected_model' || reply.locale !== ctx.locale || typeof reply.text !== 'string' || !reply.text.trim() || reply.text.length > 12000 || typeof reply.promptVersion !== 'string' || !reply.promptVersion.trim() || !Array.isArray(reply.actionIds) || reply.actionIds.length > 3 || reply.actionIds.some(id => !allowed[ctx.role].includes(id))) {
  throw new Error('The connected mentor returned an incomplete or out-of-scope response. Your question remains saved; try again.');
 }
 const blocks: GuideBlock[] = [{ type: 'text', text: reply.text, locale: ctx.locale }, ...reply.actionIds.map(id => ({ type: 'action' as const, label: labels[id][ctx.locale], path: `/dashboard/${id}`, locale: ctx.locale }))];
 return { text: reply.text, blocks, promptVersion: reply.promptVersion };
}
