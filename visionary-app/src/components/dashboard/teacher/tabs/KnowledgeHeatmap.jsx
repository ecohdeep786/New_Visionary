import { Grid3x3 } from 'lucide-react';
import { summarizeClassAssessment } from '@/lib/classAssessment';
import { classTabCopy } from '@/lib/classTabCopy';

export default function KnowledgeHeatmap({ submissions = [], assignments = [], summary: provided, accent, locale = 'en' }) {
  const copy = classTabCopy(locale);
  const { concepts, students } = provided || summarizeClassAssessment(assignments, submissions);
  const colorFor = value => value === null ? '#f1f3f4' : value >= 70 ? '#e6f4ea' : value >= 40 ? '#e8f0fe' : '#fce8e6';
  return <section className="rounded-3xl border border-[#dadce0]/60 bg-white p-6">
    <h3 className="mb-1 flex items-center gap-2 text-sm font-medium text-[#121317]"><Grid3x3 aria-hidden="true" className="h-5 w-5" style={{ color: accent }} />{copy('Recorded score heatmap')}</h3>
    <p className="mb-6 text-xs text-[#5f6368]">{copy('Recorded assignment scores by concept. Use these alongside conversations and practice to decide what support helps.')}</p>
    {!concepts.length || !students.length ? <p className="py-10 text-center text-sm text-[#5f6368]">{copy('The heatmap fills in once you tag concepts on assignments and return graded work.')}</p> : <>
      <div tabIndex={0} role="region" aria-label={copy('Recorded score heatmap')} className="overflow-x-auto rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4285F4]">
        <table className="min-w-full border-separate border-spacing-1"><caption className="sr-only">{copy('Recorded assignment scores by concept. Use these alongside conversations and practice to decide what support helps.')}</caption>
          <thead><tr><th scope="col" className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1.5 text-left text-xs font-medium text-[#5f6368]">{copy('Student')}</th>{concepts.map(topic => <th scope="col" key={topic} className="min-w-16 whitespace-nowrap px-2 py-1.5 text-xs font-medium text-[#5f6368]">{topic}</th>)}</tr></thead>
          <tbody>{students.map(student => <tr key={student.id}><th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1.5 text-left text-sm font-normal text-[#5f6368]">{student.name || copy('Student')}</th>{concepts.map(topic => { const value = Object.hasOwn(student.concepts, topic) ? student.concepts[topic] : null; return <td key={topic} className="px-0.5 py-0.5"><div className="flex h-9 min-w-[56px] items-center justify-center rounded-lg text-xs font-medium" style={{ backgroundColor: colorFor(value), color: '#121317' }} title={value === null ? copy('No valid graded evidence') : `${value}%`}>{value === null ? '—' : `${value}%`}</div></td>; })}</tr>)}</tbody>
        </table>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4">{[['Score 70%+', '#34a853'], ['Score 40–69%', accent], ['Score below 40%', '#ea4335'], ['No valid graded evidence', '#dadce0']].map(([label, color]) => <div key={label} className="flex items-center gap-1.5"><span aria-hidden="true" className="h-3.5 w-3.5 rounded" style={{ backgroundColor: color }} /><span className="text-xs text-[#5f6368]">{copy(label)}</span></div>)}</div>
    </>}
  </section>;
}
