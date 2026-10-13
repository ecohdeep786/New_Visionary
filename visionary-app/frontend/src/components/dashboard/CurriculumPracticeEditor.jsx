import { useWorkspace } from '@/hooks/useWorkspace';
import { organizationAuthorCopy } from '@/lib/organizationAuthorCopy';
export default function CurriculumPracticeEditor({
  questions = [],
  onChange
}) {
  const {
    data
  } = useWorkspace();
  const interfaceLocale = data?.preferences.interfaceLocale || 'en';
  const copy = organizationAuthorCopy(interfaceLocale);
  if (!Array.isArray(questions) || questions.some(row => !row || typeof row.id !== 'string' || typeof row.prompt !== 'string' || !Array.isArray(row.options) || row.options.some(value => typeof value !== 'string'))) return <p role="alert" className="v-notice v-error">{copy("The recovered practice bank cannot be edited safely. Export it before restoring a valid copy.")}</p>;
  function change(id, patch) {
    onChange(questions.map(row => row.id === id ? {
      ...row,
      ...patch
    } : row));
  }
  return <section className="mt-5"><h5 className="text-sm font-medium">{copy("Authored private practice")}</h5><p className="v-muted mt-2">{copy("Optional exercises with reviewed answer keys. Rehearsal stays private, does not set class grades or mastery, and uses this fixed delivered revision. Questions are written here, not generated from a book.")}</p>{questions.map((question, index) => <fieldset className="mt-3 rounded-xl border p-3" key={question.id}><legend className="px-1 text-sm font-medium">{copy('Practice question {number}', {
          number: index + 1
        })}</legend><label className="block text-sm">{copy("Practice prompt")}<textarea aria-label={copy("Practice prompt")} className="v-field mt-2" rows={3} maxLength={2000} value={question.prompt} onChange={event => change(question.id, {
          prompt: event.target.value
        })} /></label>{question.options.map((option, position) => <label className="mt-3 block text-sm" key={position}>{copy('Answer option {number}', {
          number: position + 1
        })}<input aria-label={copy("Answer option {number}", {
          number: position + 1
        })} className="v-field mt-2" maxLength={1000} value={option} onChange={event => change(question.id, {
          options: question.options.map((value, i) => i === position ? event.target.value : value)
        })} /></label>)}<label className="mt-3 block text-sm">{copy("Reviewed correct option")}<select aria-label={copy("Reviewed correct option")} className="v-field mt-2" value={question.answerIndex} onChange={event => change(question.id, {
          answerIndex: Number(event.target.value)
        })}><option value={-1}>{copy("Choose the reviewed correct option")}</option>{question.options.map((option, position) => <option key={position} value={position}>{copy('Option {number}: {text}', {
              number: position + 1,
              text: option || copy('Complete the option text')
            })}</option>)}</select></label><div className="mt-3 flex flex-wrap gap-2"><button type="button" className="v-button" disabled={question.options.length >= 6} onClick={() => change(question.id, {
          options: [...question.options, '']
        })}>{copy("Add answer option")}</button><button type="button" className="v-button" disabled={question.options.length <= 2} onClick={() => change(question.id, {
          options: question.options.slice(0, -1),
          answerIndex: question.answerIndex === question.options.length - 1 ? -1 : question.answerIndex
        })}>{copy("Remove last option")}</button></div><button type="button" className="v-button mt-3" onClick={() => onChange(questions.filter(row => row.id !== question.id))}>{copy("Remove practice question")}</button></fieldset>)}<button type="button" className="v-button mt-3" disabled={questions.length >= 20} onClick={() => onChange([...questions, {
      id: crypto.randomUUID(),
      prompt: '',
      options: ['', '', '', ''],
      answerIndex: -1
    }])}>{copy("Add practice question")}</button>{!questions.length && <p className="v-muted mt-3">{copy("No authored exercises yet. Learners retain their assigned explanation and response flow.")}</p>}</section>;
}
export function CurriculumPracticeReview({
  questions = []
}) {
  const {
    data
  } = useWorkspace();
  const interfaceLocale = data?.preferences.interfaceLocale || 'en';
  const copy = organizationAuthorCopy(interfaceLocale);
  if (!questions.length) return null;
  return <section className="mt-4"><h4 className="font-medium">{copy("Practice-bank review \xB7 author/teacher view")}</h4><p className="v-muted mt-2">{copy("Check each key before approval or assignment. Learner question views omit these keys.")}</p><ol className="mt-3 list-decimal space-y-4 pl-5">{questions.map(row => <li key={row.id}><p>{row.prompt}</p><ul className="mt-2 list-disc pl-4 text-sm">{row.options.map((option, index) => <li key={index}>{option}{index === row.answerIndex ? copy(" \xB7 authored correct answer") : ''}</li>)}</ul></li>)}</ol></section>;
}
