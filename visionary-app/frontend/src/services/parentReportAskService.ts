import type { RequestContext } from '../domain/workspace.ts';
import { familyReports } from './workspaceService.ts';
import { getParentSummary } from './mentorStateService.ts';

/** Rebuild the permitted report for every request. No child detail goes in the URL or a conversation. */
export function getParentReportAsk(ctx: RequestContext, childId: string, days: 7 | 30 = 7) {
 if (ctx.role !== 'parent' || !childId) throw new Error('Open a shared child report from your parent workspace.');
 const report = familyReports(ctx, days).find(row => row.id === childId);
 if (!report) throw new Error('This child’s summary is no longer shared with you. Review your connections.');
 const summary = getParentSummary(ctx, childId, days);
 return {
  childId, name: report.name, period: summary.period,
  completed: report.completed,
  concepts: summary.concepts.map(concept => ({ stage: concept.stage, correct: concept.correct, total: concept.total })),
 };
}

export function answerParentReportQuestion(ctx: RequestContext, childId: string, question: string, days: 7 | 30 = 7) {
 const view = getParentReportAsk(ctx, childId, days);
 if (!question.trim()) throw new Error('Choose or enter a question first.');
 const recorded = view.concepts.reduce((sum, concept) => sum + concept.total, 0);
 const correct = view.concepts.reduce((sum, concept) => sum + concept.correct, 0);
 const evidence = recorded
  ? `${correct} of ${recorded} recorded check answers were correct across ${view.concepts.length} concept${view.concepts.length === 1 ? '' : 's'} in the last ${days} days. This is limited activity evidence, not a measure of ability or a diagnosis.`
  : `No guided check answers were shared in the last ${days} days. That means there is no recent recorded evidence here, not that your child knows nothing.`;
 const teacherQuestion = recorded
  ? 'You could ask their teacher: “Which idea would be most useful to revisit together, and what example should we try?”'
  : 'You could ask their teacher: “What is one topic they are exploring now, and how can we support it at home?”';
 const activity = recorded
  ? 'Try a short, low-pressure review: ask your child to explain one recent idea using an example of their choosing. Listen first, then ask what they would like to practice.'
  : 'Invite your child to choose one topic they enjoyed recently and show you how it works. If they prefer, ask what they would like to explore next.';
 const normalized = question.toLowerCase();
 const kind = /teacher|school|class|शिक्षक|विद्यालय|कक्षा|শিক্ষক|স্কুল|শ্রেণি/.test(normalized) ? 'teacher'
  : /activity|home|practice|support|help|गतिविधि|घर|अभ्यास|सहायता|मदद|কার্যকলাপ|বাড়ি|অনুশীলন|সহায়/.test(normalized) ? 'activity'
   : /evidence|progress|mean|week|learn|doing|साक्ष्य|प्रगति|मतलब|सप्ताह|सीख|প্রমাণ|অগ্রগতি|মানে|সপ্তাহ|শেখা/.test(normalized) ? 'evidence' : 'unsupported';
 const answer = kind === 'teacher' ? teacherQuestion : kind === 'activity' ? activity : kind === 'evidence' ? evidence
    : 'I can explain the shared evidence, suggest a question for the teacher, or suggest a home activity. Choose one of those topics to continue.';
 return { name: view.name, period: view.period, kind, counts: { correct, recorded, concepts: view.concepts.length, days }, answer, evidence, teacherQuestion, activity, source: `Active progress-summary sharing · last ${days} days · saved local records` };
}
