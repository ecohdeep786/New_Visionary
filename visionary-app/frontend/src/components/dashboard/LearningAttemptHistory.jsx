import { useWorkspace } from '@/hooks/useWorkspace';
import { learningCopy, learningDate } from '@/lib/learningCopy';

export default function LearningAttemptHistory({ attempts = [], locale: sourceLocale = 'en' }) {
 const { data } = useWorkspace();
 const locale = data?.preferences.interfaceLocale || 'en';
 const copy = learningCopy(locale);
 if (!Array.isArray(attempts)) return <p className="v-notice" role="status" lang={locale}>{copy('Attempt details unavailable')}</p>;
 if (!attempts.length) return null;
 return <details lang={locale} className="v-attempt-history mt-6"><summary className="cursor-pointer font-medium">{copy('Review {count} saved attempts', { count: attempts.length })}</summary><ol className="mt-4 space-y-3">{[...attempts].reverse().map((attempt, index) => {
  if (!attempt || !attempt.question || !Array.isArray(attempt.question.options) || typeof attempt.question.prompt !== 'string') return <li key={`unavailable-${index}`} className="v-notice">{copy('Attempt details unavailable')}</li>;
  const language = ['en', 'hi', 'bn'].includes(attempt.locale) ? attempt.locale : sourceLocale;
  const answer = Number.isInteger(attempt.selectedIndex) ? attempt.question.options[attempt.selectedIndex] : undefined;
  return <li key={`${attempt.id || 'attempt'}-${index}`} className="rounded-xl border border-[#dadce0] bg-white p-4"><p className="v-muted text-xs">{copy(attempt.kind === 'check' ? 'Understanding check' : 'Practice')} · {learningDate(attempt.at, locale)}</p><p className="mt-2 text-sm font-medium" lang={language}>{attempt.question.prompt}</p><p className="mt-1 text-sm">{copy('Your answer:')} {typeof answer === 'string' ? <span lang={language}>{answer}</span> : copy('Unavailable')}</p><p className="v-muted mt-1 text-sm">{copy(typeof attempt.correct !== 'boolean' ? 'Unavailable' : attempt.correct ? 'Recorded correct' : 'Recorded for review')} · {copy(attempt.question.source === 'authored-sample' ? 'Authored sample' : 'Sourced question')}</p></li>;
 })}</ol></details>;
}
