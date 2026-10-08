import { learningProgressText } from '@/lib/learningProgressCopy';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarClock, CheckCheck, Hammer, History, Layers } from 'lucide-react';
import { getLearningProgress } from '@/services/learningProgressService';
import LearnerGoals from '@/components/dashboard/LearnerGoals';
import WorkspaceIntro from '@/components/dashboard/WorkspaceIntro';
import SpotIllustration from '@/components/landing/SpotIllustration';

const SOURCE_LABEL = { en: 'Evidence sources and limits', hi: 'प्रमाण के स्रोत और सीमाएँ', bn: 'প্রমাণের উৎস ও সীমাবদ্ধতা' };

export default function LearningProgress({ ctx, data }) {
  const locale = data.preferences.interfaceLocale || 'en';
  const t = key => learningProgressText(locale, key);
  const [period, setPeriod] = useState(7);
  const [query, setQuery] = useState('');
  const [retry, setRetry] = useState(0);
  if (ctx.role === 'parent') return <div className="v-page"><h1 className="v-title">Learning evidence belongs to a learning workspace</h1><p className="v-muted mt-3">This parent workspace shows only accepted child summaries. Add or switch to a learner role to review your own learning evidence.</p><Link className="v-button mt-4" to="/dashboard/reports">Open child reports</Link></div>;
  let report;
  try { report = getLearningProgress(ctx, period); } catch (error) {
    return <div lang={locale} className="v-page"><h1 className="v-title">{t('title')}</h1><p className="v-notice v-error" role="alert"><span lang="en">{error.message}</span></p><button className="v-button" onClick={() => setRetry(retry + 1)}>{t('retry')}</button></div>;
  }
  const rows = report.objectives.filter(row => row.title.toLowerCase().includes(query.trim().toLowerCase()));
  return <div lang={locale} className="v-page v-progress-page">
    <WorkspaceIntro title={t('title')} description={t('intro')} icon={History} />
    <section className="v-card v-progress-controls" aria-labelledby="evidence-over-time">
      <h2 id="evidence-over-time" className="text-lg font-medium">{t('overTime')}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm">{t('period')}<select aria-label={t('period')} className="v-field mt-2" value={period} onChange={event => setPeriod(event.target.value === 'all' ? 'all' : Number(event.target.value))}><option value={7}>{t('seven')}</option><option value={30}>{t('thirty')}</option><option value="all">{t('all')}</option></select></label><label className="text-sm">{t('find')}<input aria-label={t('find')} className="v-field mt-2" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
      <p className="v-muted mt-4">{t('policy')}</p>
      <p className="v-muted mt-2">{t('asOf')} <time dateTime={report.asOf}>{new Date(report.asOf).toLocaleString(locale)}</time> · {t('local')}</p>
      <details className="v-evidence-source-notes"><summary>{SOURCE_LABEL[locale] || SOURCE_LABEL.en}</summary><p className="v-muted mt-3">{t('sources')}</p><p className="v-muted mt-2">{t('accuracy')}</p></details>
    </section>
    {report.unavailable.length > 0 && <section className="v-notice v-error" role="alert"><h2 className="text-base font-medium">{t('unavailable')}</h2>{report.unavailable.map(item => <p className="mt-2 text-sm" key={item.source}><span lang="en">{item.source}: {item.message}</span></p>)}<button className="v-button mt-3" onClick={() => setRetry(retry + 1)}>{t('retry')}</button></section>}
    {rows.length ? rows.map(row => {
      const original = row.events.find(event => event.resumePath);
      return <section className="v-card v-evidence-card" key={row.id}>
        <div className="v-evidence-card-heading"><span className="v-evidence-objective-icon"><Layers size={22} aria-hidden="true" /></span><div className="min-w-0 flex-1"><h2 lang={row.titleLocale || 'en'} className="text-lg font-medium">{row.title}</h2><p className="v-muted mt-1">{row.source === 'guided' ? t('guided') : t('journey')}</p></div><span className="v-evidence">{t(row.stage)}</span></div>
        <dl className="v-evidence-metrics">
          <EvidenceMetric icon={CheckCheck} label={t('answers')} value={row.total ? `${row.correct}/${row.total}` : t('unmeasured')} description={row.total ? t('correct') : undefined} />
          <EvidenceMetric icon={Hammer} label={t('applications')} value={String(row.applications)} description={t('unverified')} />
          <EvidenceMetric icon={CalendarClock} label={t('review')} value={row.dueAt ? new Date(row.dueAt).toLocaleDateString(locale) : t('unscheduled')} />
        </dl>
        <div className="v-evidence-card-actions">{original && <Link className="v-button" to={original.resumePath}>{t('open')}<ArrowUpRight size={16} aria-hidden="true" /><span lang={row.titleLocale || 'en'} className="sr-only">: {row.title}</span></Link>}</div>
        <details className="v-evidence-history"><summary><History size={16} aria-hidden="true" />{t('timeline')} <span>({row.events.length})</span></summary><ol className="v-evidence-timeline">{row.events.map(event => <li className="v-evidence-event" key={event.id}><span className="v-evidence-event-dot" aria-hidden="true" /><div><p className="font-medium">{event.kind === 'retrieval' ? t('retrieval') : event.kind === 'application' ? t('application') : event.kind === 'check' ? t('check') : t('practice')}</p><p className="v-muted mt-1"><time dateTime={event.at}>{new Date(event.at).toLocaleString(locale)}</time> · {event.measured ? `${event.correct}/${event.total} ${t('recordedCorrect')}` : t('unverified')}</p>{event.sourceVersion && <p lang="en" className="v-muted mt-1 break-words">{event.sourceVersion}</p>}{event.resumePath && <Link className="v-button mt-3" to={event.resumePath}>{t('open')}<span lang={row.titleLocale || 'en'} className="sr-only">: {event.activityTitle}</span></Link>}</div></li>)}</ol></details>
      </section>;
    }) : <section className="v-card v-workspace-empty"><SpotIllustration subject={query ? 'compass' : 'growth'} className="v-empty-illustration v-empty-illustration-square" /><h2 className="text-lg font-medium">{query ? t('noMatch') : report.unavailable.length ? t('emptyAvailable') : report.hasSavedEvidence ? t('emptyPeriod') : t('start')}</h2><p className="v-muted mt-3">{query ? t('tryTitle') : report.hasSavedEvidence ? t('retained') : t('noKnowledge')}</p><div className="v-empty-actions">{(query || period !== 'all') && <button className="v-button" onClick={() => { setQuery(''); setPeriod('all'); }}>{t('showAll')}</button>}<Link className="v-button primary" to="/dashboard/learn">{t('choose')}<ArrowUpRight size={16} aria-hidden="true" /></Link></div></section>}
    <LearnerGoals ctx={ctx} locale={locale} />
  </div>;
}

function EvidenceMetric({ icon: Icon, label, value, description }) {
  return <div className="v-evidence-metric"><dt><Icon size={18} aria-hidden="true" />{label}</dt><dd>{value}</dd>{description && <dd className="v-evidence-metric-note">{description}</dd>}</div>;
}
