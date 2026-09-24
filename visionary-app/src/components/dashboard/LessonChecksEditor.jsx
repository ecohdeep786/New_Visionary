import { Plus, Trash2 } from 'lucide-react';

/** Teacher-authored short answers. No local model, answer key, or auto-grading. */
export default function LessonChecksEditor({ checks = [], onChange }) {
  return <section aria-labelledby="lesson-checks-title" className="rounded-2xl border border-[#dadce0] p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 id="lesson-checks-title" className="text-base font-medium">Check understanding</h3><p className="v-muted mt-1">Write up to ten short-answer questions. Learners respond in their own words; you review their work.</p></div>
      <button type="button" className="v-button" disabled={checks.length >= 10} onClick={() => onChange([...checks, { id: crypto.randomUUID(), prompt: '' }])}><Plus size={16} /> Add question</button>
    </div>
    {checks.map((check, index) => <div key={check.id} className="mt-4 flex items-end gap-2">
      <label className="min-w-0 flex-1 text-sm">Question {index + 1}<input className="v-field mt-2" maxLength={500} value={check.prompt} onChange={event => onChange(checks.map(item => item.id === check.id ? { ...item, prompt: event.target.value } : item))} placeholder="What should the learner explain?" /></label>
      <button type="button" className="v-button !px-3" aria-label={`Remove question ${index + 1}`} onClick={() => onChange(checks.filter(item => item.id !== check.id))}><Trash2 size={17} /></button>
    </div>)}
  </section>;
}
