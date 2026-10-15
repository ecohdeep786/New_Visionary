import { Layers, RefreshCw, BarChart3, Sparkles } from 'lucide-react';
import KnowledgeHeatmap from '@/components/dashboard/teacher/tabs/KnowledgeHeatmap';
import { useClassRecords } from '@/hooks/useClassRecords';
import { summarizeClassAssessment } from '@/lib/classAssessment';
import { classTabCopy } from '@/lib/classTabCopy';

export default function InsightsTab({ classId, accent, locale = 'en' }) {
  const copy = classTabCopy(locale);
  const { records, loading, unavailable, reload } = useClassRecords(classId, ['Assignment', 'Submission']);
  const summary = summarizeClassAssessment(records?.[0] || [], records?.[1] || []);
  const maxCoverage = summary.coverageRows[0]?.[1] || 1;
  return <div lang={locale} className="flex max-w-[680px] flex-col gap-6">
    <div className="flex items-start gap-4 rounded-3xl border border-[#dadce0]/60 bg-white p-6">
      <Sparkles aria-hidden="true" className="h-5 w-5 shrink-0" style={{ color: accent }} />
      <div className="min-w-0 flex-1"><h3 className="mb-1.5 text-sm font-medium text-[#121317]">{copy('AI class analysis')}</h3><p className="text-sm leading-relaxed text-[#5f6368]">{copy('AI analysis is not connected yet. The coverage and assessment summaries below use your recorded classwork.')}</p></div>
      <button onClick={reload} aria-label={copy('Refresh class records')} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full hover:bg-[#121317]/5"><RefreshCw className="h-4 w-4 text-[#5f6368]" /></button>
    </div>
    {loading ? <p role="status" className="py-8 text-center text-sm text-[#5f6368]">{copy('Loading class records…')}</p> : unavailable ? <p role="alert" className="rounded-xl bg-[#fce8e6] p-4 text-sm text-[#b3261e]">{copy('Class insights could not be loaded. Please try again.')} <button onClick={reload} className="min-h-11 underline">{copy('Retry')}</button></p> : <>
      {summary.excluded > 0 && <p role="status" className="rounded-xl border border-[#dadce0] p-4 text-sm text-[#5f6368]">{copy('{count} graded records have missing or invalid scores, point totals, assignments or learner identifiers and are excluded.', { count: summary.excluded })}</p>}
      <section className="rounded-3xl border border-[#dadce0]/60 bg-white p-6">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-medium text-[#121317]"><BarChart3 aria-hidden="true" className="h-5 w-5" style={{ color: accent }} />{copy('Concept assessment')}</h3>
        <p className="mb-6 text-xs text-[#5f6368]">{copy('Average scores from graded assignments, normalized to a percentage. A useful signal—not a complete measure of understanding.')}</p>
        {!summary.assessmentRows.length ? <p className="py-10 text-center text-sm text-[#5f6368]">{copy('No valid graded concept evidence yet. Tag concepts and return graded work to see recorded scores here.')}</p> : <div className="flex flex-col gap-4">{summary.assessmentRows.map(row => <div key={row.concept}>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2"><span className="min-w-0 max-w-full break-words text-sm text-[#5f6368]">{row.concept}</span><span className="text-xs text-[#5f6368]">{copy('{score}% · {count} graded', { score: row.avg, count: row.count })}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-[#dadce0]"><div className="h-full rounded-full" style={{ width: `${row.avg}%`, backgroundColor: row.avg >= 70 ? '#34a853' : row.avg >= 40 ? accent : '#ea4335' }} /></div>
        </div>)}</div>}
      </section>
      <KnowledgeHeatmap summary={summary} accent={accent} locale={locale} />
      <section className="rounded-3xl border border-[#dadce0]/60 bg-white p-6">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-medium text-[#121317]"><Layers aria-hidden="true" className="h-5 w-5 text-[#5f6368]" />{copy('Concept coverage')}</h3>
        <p className="mb-6 text-xs text-[#5f6368]">{copy('Topics tagged on recorded assignments. Each assignment counts once per topic.')}</p>
        {!summary.coverageRows.length ? <p className="py-10 text-center text-sm text-[#5f6368]">{copy('No concepts tagged yet. Add concept tags when creating assignments to map your coverage.')}</p> : <div className="flex flex-col gap-4">{summary.coverageRows.map(([topic, count]) => <div key={topic}>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2"><span className="min-w-0 max-w-full break-words text-sm text-[#5f6368]">{topic}</span><span className="text-xs text-[#5f6368]">{copy('{count} assignments', { count })}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-[#dadce0]"><div className="h-full rounded-full" style={{ width: `${count / maxCoverage * 100}%`, backgroundColor: accent }} /></div>
        </div>)}</div>}
      </section>
    </>}
  </div>;
}
