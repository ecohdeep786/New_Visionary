export default function LearningAttemptHistory({ attempts = [], locale = 'en' }) {
 if (!attempts.length) return null;
 return <details className="v-attempt-history mt-6"><summary className="cursor-pointer font-medium">Review {attempts.length} saved {attempts.length === 1 ? 'attempt' : 'attempts'}</summary>
  <ol className="mt-4 space-y-3">{[...attempts].reverse().map(attempt => <li key={attempt.id} className="rounded-xl border border-[#dadce0] bg-white p-4">
   <p className="v-muted text-xs">{attempt.kind === 'check' ? 'Understanding check' : 'Practice'} · {new Intl.DateTimeFormat(attempt.locale || locale, { dateStyle: 'medium' }).format(new Date(attempt.at))}</p>
   <p className="mt-2 text-sm font-medium" lang={attempt.locale || locale}>{attempt.question.prompt}</p>
   <p className="mt-1 text-sm">Your answer: <span lang={attempt.locale || locale}>{attempt.question.options[attempt.selectedIndex] || 'Unavailable'}</span></p>
   <p className="v-muted mt-1 text-sm">{attempt.correct ? 'Recorded correct' : 'Recorded for review'} · {attempt.question.source === 'authored-sample' ? 'Authored sample' : 'Sourced question'}</p>
  </li>)}</ol>
 </details>;
}
