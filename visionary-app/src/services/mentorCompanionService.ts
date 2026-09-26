import type { GuideBlock, Locale, RequestContext } from '../domain/workspace.ts';
import { snapshot, workspaceIdentity, familyReports, updateConversation } from './workspaceService.ts';
import { getStudentState, getWeeklyObservations, getStudentClasswork, getAssignedClasses, emitInteractionEvent } from './mentorStateService.ts';
import { getLearningWorkspace, sendTeachingTurn } from './learningPipelineService.ts';
import { getDailyPlan, type PlanStep } from './dailyPlanService.ts';
import { appendGuideBlocks } from './workspaceService.ts';
import { hasSafetyConcern } from './teachingInterface.ts';
import { isMentorModelConfigured, requestMentorModelTurn } from './mentorModelService.ts';

// The mentor companion: one category-aware intelligence surface over the user's real
// records. It assembles the full context seam the future model will consume, routes
// natural-language requests to real actions in the user's own language, and offers
// proactive, evidence-based support per category. Nothing here generates model answers:
// open-ended questions fall through to the teaching interface seam, and every reply
// states that it comes from saved records.
type MentorIntent = 'plan' | 'continue' | 'practice' | 'classwork' | 'build' | 'progress' | 'navigate' | 'greet';
const INTENTS: Array<{ intent: MentorIntent; keywords: string[] }> = [
 { intent: 'plan', keywords: ['today', 'plan', 'what now', 'what should i do', 'agenda', 'next step', 'आज', 'योजना', 'क्या करूँ', 'आगे क्या', 'परिकल्पना', 'আজ', 'পরিকল্পনা', 'কী করব', 'পরের'] },
 { intent: 'continue', keywords: ['continue', 'resume', 'learn', 'study', 'lesson', 'start', 'सीख', 'पढ़', 'जारी', 'शुरू', 'पाठ', 'শেখ', 'পড়', 'চালিয়ে', 'শুরু'] },
 { intent: 'practice', keywords: ['practice', 'review', 'quiz', 'revise', 'test me', 'अभ्यास', 'दोहरा', 'पुनरावृत्ति', 'क्विज़', 'अभ्यास कर', 'অভ্যাস', 'পুনরালোচনা', 'কুইজ'] },
 { intent: 'classwork', keywords: ['classwork', 'class', 'homework', 'assignment', 'submit', 'school', 'कक्षा', 'गृहकार्य', 'होमवर्क', 'असाइनमेंट', 'स्कूल', 'ক্লাস', 'হোমওয়ার্ক', 'অ্যাসাইনমেন্ট', 'স্কুল'] },
 { intent: 'build', keywords: ['build', 'project', 'make', 'create', 'portfolio', 'apply', 'बना', 'प्रोजेक्ट', 'निर्माण', 'पोर्टफोलियो', 'प्रोजेक्ट बना', 'প্রজেক্ট', 'তৈরি', 'পোর্টফোলিও'] },
 { intent: 'progress', keywords: ['progress', 'how am i doing', 'mastery', 'evidence', 'improving', 'प्रगति', 'कैसा कर रहा', 'सुधार', 'अग्रगति', 'অগ্রগতি', 'কেমন চলছে', 'উন্নতি'] },
 { intent: 'navigate', keywords: ['open', 'go to', 'show me', 'take me', 'खोलो', 'दिखाओ', 'खोल', 'খোলো', 'দেখাও'] },
 { intent: 'greet', keywords: ['hello', 'hey', 'good morning', 'good evening', 'namaste', 'thanks', 'नमस्ते', 'नमस्कार', 'हैलो', 'धन्यवाद', 'নমস্কার', 'হ্যালো', 'ধন্যবাদ'] },
];
const SECTIONS: Array<{ match: string[]; label: Record<Locale, string>; path: string }> = [
 { match: ['learn', 'सीख', 'पढ़ाई', 'শেখা'], label: { en: 'Open Learn', hi: 'सीखें खोलें', bn: 'শেখা খুলুন' }, path: '/dashboard/learn' },
 { match: ['practice', 'अभ्यास', 'অভ্যাস'], label: { en: 'Open Practice', hi: 'अभ्यास खोलें', bn: 'অভ্যাস খুলুন' }, path: '/dashboard/practice' },
 { match: ['build', 'project', 'प्रोजेक्ट', 'প্রজেক্ট'], label: { en: 'Open Build', hi: 'बिल्ड खोलें', bn: 'বিল্ড খুলুন' }, path: '/dashboard/build' },
 { match: ['ask', 'question', 'प्रश्न', 'প্রশ্ন'], label: { en: 'Open Ask', hi: 'पूछें खोलें', bn: 'জিজ্ঞাসা খুলুন' }, path: '/dashboard/ask' },
 { match: ['home', 'होम', 'হোম'], label: { en: 'Open Home', hi: 'होम खोलें', bn: 'হোম খুলুন' }, path: '/dashboard/home' },
 { match: ['settings', 'सेटिंग', 'সেটিংস'], label: { en: 'Open Settings', hi: 'सेटिंग खोलें', bn: 'সেটিংস খুলুন' }, path: '/dashboard/settings' },
 { match: ['support', 'help', 'सहायता', 'सहायक', 'সাহায্য'], label: { en: 'Open Support', hi: 'सहायता खोलें', bn: 'সহায়তা খুলুন' }, path: '/dashboard/support' },
 { match: ['classes', 'classwork', 'कक्षा', 'ক্লাস'], label: { en: 'Open Classes', hi: 'कक्षाएँ खोलें', bn: 'ক্লাস খুলুন' }, path: '/dashboard/classes' },
];
const t = (locale: Locale, copy: Record<Locale, string>) => copy[locale] || copy.en;
function normalize(text: string) { return ` ${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim()} `; }
function matchIntent(text: string): MentorIntent | null {
 const normalized = normalize(text);
 for (const spec of INTENTS) if (spec.keywords.some(keyword => normalized.includes(` ${keyword} `) || normalized.includes(` ${keyword}`))) return spec.intent;
 return null;
}
const isLearner = (role: string) => role === 'student' || role === 'professional';
function localizedAction(locale: Locale, label: Record<Locale, string>, path: string): GuideBlock { return { type: 'action', locale, label: label[locale] || label.en, path }; }
const SOURCE = { en: 'From your saved records — not an AI assessment.', hi: 'आपके सहेजे अभिलेखों से — यह कोई AI मूल्यांकन नहीं है।', bn: 'আপনার সংরক্ষিত রেকর্ড থেকে — এটি কোনো AI মূল্যায়ন নয়।' };

interface Reply { blocks: GuideBlock[]; text: string }
function toReply(locale: Locale, lead: Record<Locale, string>, actions: GuideBlock[]): Reply {
 const textBlocks = [t(locale, lead), t(locale, SOURCE)];
 return { blocks: [{ type: 'text', locale, text: t(locale, lead) }, ...actions, { type: 'text', locale, text: t(locale, SOURCE) }], text: textBlocks.join(' ') };
}
function planReply(locale: Locale, steps: PlanStep[], fallback: Reply): Reply {
 if (!steps.length) return fallback;
 const lead: Record<Locale, string> = {
  en: `Here is where today starts: ${steps[0].title}. ${steps.length > 1 ? `${steps.length - 1} more step${steps.length > 2 ? 's' : ''} follow it.` : ''}`,
  hi: `आज की शुरुआत यहीं से है: ${steps[0].title}.`,
  bn: `আজ শুরু হবে এখান থেকে: ${steps[0].title}.`,
 };
 const actions = steps.slice(0, 3).map(step => localizedAction(locale, { en: step.action.label, hi: step.action.label, bn: step.action.label }, step.action.path));
 return toReply(locale, lead, actions);
}
function learnerFallback(ctx: RequestContext, locale: Locale): Reply {
 const { person } = workspaceIdentity(ctx);
 const subject = person.learningContext?.subjects[0];
 if (subject) return toReply(locale, { en: `Nothing is waiting from your records yet. You can start with ${subject} or ask any question.`, hi: `आपके अभिलेखों में अभी कुछ शेष नहीं है। आप ${subject} से शुरू कर सकते हैं या कोई भी प्रश्न पूछ सकते हैं।`, bn: `আপনার রেকর্ডে এখনও কিছু বাকি নেই। আপনি ${subject} দিয়ে শুরু করতে পারেন বা যেকোনো প্রশ্ন করতে পারেন।` }, [localizedAction(locale, { en: 'Open Learn', hi: 'सीखें खोलें', bn: 'শেখা খুলুন' }, '/dashboard/learn')]);
 return toReply(locale, { en: 'Nothing is waiting from your records yet. Ask any question, or open Learn to choose a starting point.', hi: 'आपके अभिलेखों में अभी कुछ शेष नहीं है। कोई भी प्रश्न पूछें, या शुरुआती बिंदु चुनने के लिए सीखें खोलें।', bn: 'আপনার রেকর্ডে এখনও কিছু বাকি নেই। যেকোনো প্রশ্ন করুন, বা শুরুর বিন্দু বেছে নিতে শেখা খুলুন।' }, [localizedAction(locale, { en: 'Open Learn', hi: 'सीखें खोलें', bn: 'শেখা খুলুন' }, '/dashboard/learn')]);
}
function composeMentorReply(ctx: RequestContext, intent: MentorIntent, rawText: string): Reply {
 const locale = ctx.locale;
 if (intent === 'plan') {
  if (isLearner(ctx.role)) return planReply(locale, getDailyPlan(ctx).steps, learnerFallback(ctx, locale));
  if (ctx.role === 'teacher') return toReply(locale, { en: 'Your classes and preparation are ready when you are. Review evidence or continue a lesson draft.', hi: 'आपकी कक्षाएँ और तैयारी तैयार हैं। सबूत देखें या पाठ ड्राफ़्ट जारी रखें।', bn: 'আপনার ক্লাস ও প্রস্তুতি প্রস্তুত। প্রমাণ দেখুন বা পাঠের খসড়া চালিয়ে যান।' }, [localizedAction(locale, { en: 'Open preparation', hi: 'तैयारी खोलें', bn: 'প্রস্তুতি খুলুন' }, '/dashboard/prepare'), localizedAction(locale, { en: 'Review classes', hi: 'कक्षाएँ देखें', bn: 'ক্লাস দেখুন' }, '/dashboard/classes')]);
  if (ctx.role === 'parent') return toReply(locale, { en: 'You can see the week for a connected child whenever you want.', hi: 'जुड़े बच्चे का सप्ताह आप कभी भी देख सकते हैं।', bn: 'সংযুক্ত সন্তানের সপ্তাহ আপনি যেকোনো সময় দেখতে পারেন।' }, [localizedAction(locale, { en: 'View shared reports', hi: 'साझा रिपोर्ट देखें', bn: 'শেয়ার করা রিপোর্ট দেখুন' }, '/dashboard/reports')]);
  return toReply(locale, { en: 'Your organization view keeps setup and aggregate attention in one place.', hi: 'आपका संगठन दृश्य सेटअप और समग्र ध्यान एक जगह रखता है।', bn: 'আপনার সংস্থা ভিউ সেটআপ ও সামগ্রিক মনোযোগ এক জায়গায় রাখে।' }, [localizedAction(locale, { en: 'Open insights', hi: 'इनसाइट खोलें', bn: 'ইনসাইট খুলুন' }, '/dashboard/analytics')]);
 }
 if (intent === 'classwork') {
  if (ctx.role === 'student') {
   const classwork = getStudentClasswork(ctx)[0];
   if (classwork) return toReply(locale, { en: `${classwork.title} is waiting in ${classwork.className}${classwork.dueAt ? `, due ${classwork.dueAt}` : ''}.`, hi: `${classwork.title} ${classwork.className} में प्रतीक्षा कर रहा है${classwork.dueAt ? `, नियत ${classwork.dueAt}` : ''}।`, bn: `${classwork.title} ${classwork.className}-এ অপেক্ষা করছে${classwork.dueAt ? `, নির্ধারিত ${classwork.dueAt}` : ''}।` }, [localizedAction(locale, { en: 'Open classwork', hi: 'कक्षा-कार्य खोलें', bn: 'ক্লাসের কাজ খুলুন' }, `/dashboard/classes?class=${encodeURIComponent(classwork.classId)}`)]);
   return toReply(locale, { en: 'No published classwork is waiting in your enrolled classes right now.', hi: 'आपकी कक्षाओं में अभी कोई प्रकाशित कक्षा-कार्य शेष नहीं है।', bn: 'আপনার ক্লাসগুলিতে এখন কোনো প্রকাশিত কাজ বাকি নেই।' }, [localizedAction(locale, { en: 'Open Classes', hi: 'कक्षाएँ खोलें', bn: 'ক্লাস খুলুন' }, '/dashboard/classes')]);
  }
  if (ctx.role === 'teacher') {
   const classes = getAssignedClasses(ctx);
   if (classes.length) return toReply(locale, { en: `${classes[0].name} has ${classes[0].learnerCount} learners. Class evidence and submissions are one view away.`, hi: `${classes[0].name} में ${classes[0].learnerCount} शिक्षार्थी हैं। कक्षा का सबूत और प्रस्तुतियाँ एक दृश्य दूर हैं।`, bn: `${classes[0].name}-এ ${classes[0].learnerCount} জন শিক্ষার্থী। ক্লাসের প্রমাণ ও জমা এক দৃশ্য দূরে।` }, [localizedAction(locale, { en: 'Review class evidence', hi: 'कक्षा का सबूत देखें', bn: 'ক্লাসের প্রমাণ দেখুন' }, `/dashboard/class/${encodeURIComponent(classes[0].id)}`)]);
   return toReply(locale, { en: 'No class is assigned to this workspace yet. Preparation tools are ready.', hi: 'इस कार्यक्षेत्र में अभी कोई कक्षा नियत नहीं है। तैयारी उपकरण तैयार हैं।', bn: 'এই ওয়ার্কস্পেসে এখনও কোনো ক্লাস নেই। প্রস্তুতির সরঞ্জাম প্রস্তুত।' }, [localizedAction(locale, { en: 'Open preparation', hi: 'तैयारी खोलें', bn: 'প্রস্তুতি খুলুন' }, '/dashboard/prepare')]);
  }
  if (ctx.role === 'parent') {
   const child = familyReports(ctx)[0];
   if (child) return toReply(locale, { en: `${child.name}'s shared week is ready — progress summaries only, never private conversations.`, hi: `${child.name} का साझा सप्ताह तैयार है — केवल प्रगति सारांश, कभी भी निजी बातचीत नहीं।`, bn: `${child.name}-এর শেয়ার করা সপ্তাহ প্রস্তুত — শুধু অগ্রগতির সারসংক্ষেপ, কখনও ব্যক্তিগত কথোপকথন নয়।` }, [localizedAction(locale, { en: 'View shared report', hi: 'साझा रिपोर्ट देखें', bn: 'শেয়ার করা রিপোর্ট দেখুন' }, `/dashboard/reports?child=${encodeURIComponent(child.id)}`)]);
  }
  return toReply(locale, { en: 'Connect a child with progress sharing to see their week.', hi: 'सप्ताह देखने के लिए प्रगति-साझा करते हुए एक बच्चे को जोड़ें।', bn: 'সপ্তাহ দেখতে অগ্রগতি-ভাগাভাগিসহ একটি সন্তানকে সংযুক্ত করুন।' }, [localizedAction(locale, { en: 'Manage connections', hi: 'कनेक्शन प्रबंधित करें', bn: 'সংযোগ পরিচালনা করুন' }, '/dashboard/child')]);
 }
 if (intent === 'continue' || intent === 'practice' || intent === 'build' || intent === 'progress') {
  if (!isLearner(ctx.role)) return composeMentorReply(ctx, 'plan', rawText);
  const units = getLearningWorkspace(ctx).units;
  const openUnit = [...units].filter(u => u.stage !== 'completed').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const states = getStudentState(ctx).concepts;
  const due = states.filter(c => c.dueAt && new Date(c.dueAt).getTime() <= Date.now()).sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)))[0];
  const titles = new Map(units.map(u => [u.conceptId, u.title]));
  if (intent === 'continue') {
   if (openUnit) return toReply(locale, { en: `${openUnit.title} is open at ${openUnit.stage}. Everything you answered is saved.`, hi: `${openUnit.title} ${openUnit.stage} पर खुला है। आपके सभी उत्तर सहेजे गए हैं।`, bn: `${openUnit.title} ${openUnit.stage}-এ খোলা আছে। আপনার সব উত্তর সংরক্ষিত।` }, [localizedAction(locale, { en: 'Continue learning', hi: 'सीखना जारी रखें', bn: 'শেখা চালিয়ে যান' }, `/dashboard/learn?unit=${encodeURIComponent(openUnit.id)}`)]);
   return learnerFallback(ctx, locale);
  }
  if (intent === 'practice') {
   if (due) { const known = titles.get(due.conceptId); return toReply(locale, { en: `A review is due${known ? `: ${known}` : ''}. Practice adapts to how you answer.`, hi: `एक पुनरावृत्ति देय है${known ? `: ${known}` : ''}। अभ्यास आपके उत्तरों के अनुसार ढल जाता है।`, bn: `একটি পুনরালোচনা বাকি${known ? `: ${known}` : ''}। অভ্যাস আপনার উত্তরের সাথে মানিয়ে চলে।` }, [localizedAction(locale, { en: 'Open Practice', hi: 'अभ्यास खोलें', bn: 'অভ্যাস খুলুন' }, '/dashboard/practice')]); }
   return toReply(locale, { en: 'No review is due from your records. Practice still builds strength from any mastered concept.', hi: 'आपके अभिलेखों से अभी कोई पुनरावृत्ति देय नहीं है। फिर भी अभ्यास किसी भी अवधारणा से मजबूती बनाता है।', bn: 'আপনার রেকর্ড থেকে এখন কোনো পুনরালোচনা বাকি নেই। তবু অভ্যাস যেকোনো ধারণা থেকে দক্ষতা বাড়ায়।' }, [localizedAction(locale, { en: 'Open Practice', hi: 'अभ्यास खोलें', bn: 'অভ্যাস খুলুন' }, '/dashboard/practice')]);
  }
  if (intent === 'build') {
   const artifact = [...snapshot(ctx).artifacts].filter(a => a.status !== 'completed').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
   if (artifact) return toReply(locale, { en: `${artifact.title} is unfinished in Build. Guided application starts from a checked and practised concept.`, hi: `${artifact.title} बिल्ड में अपूर्ण है। निर्देशित अनुप्रयोग जाँचे और अभ्यासे अवधारणा से शुरू होता है।`, bn: `${artifact.title} বিল্ডে অসম্পূর্ণ। নির্দেশিত প্রয়োগ যাচাই ও অভ্যাস করা ধারণা থেকে শুরু হয়।` }, [localizedAction(locale, { en: 'Open projects', hi: 'प्रोजेक्ट खोलें', bn: 'প্রজেক্ট খুলুন' }, '/dashboard/build')]);
   return toReply(locale, { en: 'No project is open. Complete a comprehension check and practice step, then Build guides your application.', hi: 'कोई प्रोजेक्ट खुला नहीं है। बोध-जाँच और अभ्यास पूरा करें, फिर बिल्ड आपके अनुप्रयोग में मार्गदर्शन करता है।', bn: 'কোনো প্রজেক্ট খোলা নেই। বোঝার যাচাই ও অভ্যাস শেষ করুন, তারপর বিল্ড প্রয়োগে সহায়তা করে।' }, [localizedAction(locale, { en: 'Open Build', hi: 'बिल्ड खोलें', bn: 'বিল্ড খুলুন' }, '/dashboard/build')]);
  }
  const strong = states.filter(c => c.stage === 'Secure' || c.stage === 'Mastered').length;
  const review = states.filter(c => c.stage === 'Needs review').length;
  return toReply(locale, { en: `Your recorded evidence shows ${strong} secure concept${strong === 1 ? '' : 's'} and ${review} needing review. Accuracy comes from answers, never guesses.`, hi: `आपके दर्ज सबूत ${strong} सुदृढ़ अवधारणाएँ और ${review} पुनरावृत्ति-योग्य दिखाते हैं। सटीकता उत्तरों से आती है, कभी अनुमान से नहीं।`, bn: `আপনার নথিভুক্ত প্রমাণ ${strong}টি সুদৃঢ় ধারণা এবং ${review}টি পুনরালোচনা-প্রয়োজন দেখায়। নির্ভুলতা উত্তর থেকে আসে, কখনও অনুমান থেকে নয়।` }, [localizedAction(locale, { en: 'Open your evidence', hi: 'अपना सबूत खोलें', bn: 'আপনার প্রমাণ খুলুন' }, '/dashboard/progress')]);
 }
 if (intent === 'navigate') {
  const normalized = normalize(rawText);
  const section = SECTIONS.find(s => s.match.some(word => normalized.includes(` ${word} `)));
  if (section) return toReply(locale, { en: `${section.label.en} — right away.`, hi: `${section.label.hi} — अभी।`, bn: `${section.label.bn} — এখনই।` }, [localizedAction(locale, section.label, section.path)]);
  return composeMentorReply(ctx, 'plan', rawText);
 }
 const first = composeMentorReply(ctx, 'plan', rawText);
 return toReply(locale, { en: 'I am here with you. Here is where things stand:', hi: 'मैं आपके साथ हूँ। हालत यह है:', bn: 'আমি আপনার সাথে আছি। পরিস্থিতি এই:' }, first.blocks.filter(block => block.type === 'action') as GuideBlock[]);
}
/** Proactive, evidence-based check-in for the category's mentor surface. */
export function mentorGreeting(ctx: RequestContext): { text: string; actions: { label: string; path: string }[] } {
 const locale = ctx.locale;
 const reply = composeMentorReply(ctx, 'plan', '');
 const actions = reply.blocks.filter((block): block is Extract<GuideBlock, { type: 'action' }> => block.type === 'action').slice(0, 2).map(block => ({ label: block.label, path: block.path }));
 return { text: reply.text.replace(t(locale, SOURCE), '').trim(), actions };
}
/** The full context seam the real model will consume; never emitted into L7 events. */
export function buildMentorPacket(ctx: RequestContext) {
 const { person } = workspaceIdentity(ctx);
 const data = snapshot(ctx);
 const plan = isLearner(ctx.role) ? getDailyPlan(ctx).steps.map(step => ({ kind: step.kind, title: step.title, done: step.done })) : [];
 return {
  promptVersion: 'mentor-context-v1', role: ctx.role, locale: ctx.locale,
  profile: person.learningContext ?? null,
  plan, concepts: isLearner(ctx.role) ? getStudentState(ctx).concepts.slice(0, 5) : [],
  observations: getWeeklyObservations(ctx).slice(0, 3).map(item => item.text),
  openProjects: data.artifacts.filter(a => a.status !== 'completed').length,
  conversationTitles: data.preferences.memory ? data.conversations.filter(c => c.useForPersonalization).slice(0, 5).map(c => c.title) : [],
 };
}
/** One mentor turn: real actions from saved records, or the teaching seam for open questions. */
export async function sendMentorTurn(ctx: RequestContext, conversationId: string, text: string, inputType: 'text' | 'voice' = 'text') {
 const trimmed = text.trim();
 if (!trimmed) throw new Error('Type a question first.');
 updateConversation(ctx, conversationId, { draft: trimmed });
 // Safety takes precedence over a matching plan/navigation intent and over any model.
 if (hasSafetyConcern(trimmed)) return sendTeachingTurn(ctx, conversationId, trimmed, inputType);
 if (isMentorModelConfigured()) {
  const packet = buildMentorPacket(ctx);
  const started = Date.now();
  emitInteractionEvent(ctx, { app: 'ASK', action: 'request', inputType, language: ctx.locale, sessionId: conversationId, promptVersion: packet.promptVersion });
  try {
   const reply = await requestMentorModelTurn(ctx, trimmed, packet);
   if (!reply) throw new Error('The mentor connection changed. Your question remains saved; try again.');
   appendGuideBlocks(ctx, conversationId, trimmed, reply.blocks, 'model');
   emitInteractionEvent(ctx, { app: 'ASK', action: 'response', inputType, responseStatus: 'ready', language: ctx.locale, sessionId: conversationId, latency: Date.now() - started, promptVersion: reply.promptVersion });
   return { status: 'model' as const, text: reply.text, blocks: reply.blocks };
  } catch (error) {
   if (!(error instanceof DOMException && error.name === 'AbortError')) emitInteractionEvent(ctx, { app: 'ASK', action: 'response', inputType, responseStatus: 'error', language: ctx.locale, sessionId: conversationId, latency: Date.now() - started, promptVersion: packet.promptVersion });
   throw error;
  }
 }
 const intent = matchIntent(trimmed);
 if (!intent) return sendTeachingTurn(ctx, conversationId, text, inputType);
 const reply = composeMentorReply(ctx, intent, trimmed);
 appendGuideBlocks(ctx, conversationId, trimmed, reply.blocks, 'mentor');
 emitInteractionEvent(ctx, { app: 'ASK', action: 'request', inputType, language: ctx.locale, sessionId: conversationId, intent: intent === 'plan' ? 'plan' : intent === 'build' ? 'build' : 'understand' });
 emitInteractionEvent(ctx, { app: 'ASK', action: 'response', inputType, responseStatus: 'ready', language: ctx.locale, sessionId: conversationId });
 return { status: 'mentor' as const, text: reply.text, blocks: reply.blocks };
}
