import {workspacePresentationCopy} from '@/lib/workspacePresentationCopy';
import {roleMentorCopy} from '@/lib/roleMentorCopy';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRoleMentorView, requestTeacherSupport, saveCareerTarget, saveTeacherPreparation } from '@/services/roleMentorService';

function EvidenceTable({ locale, rows, aggregate = false }) {
  const t = roleMentorCopy(locale);
  if (!rows.length) return <p className="v-muted">{t('No shared evidence yet. An empty history is not a learning gap.')}</p>;
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">{aggregate ? t('Shared concept evidence, aggregated without learner identities') : t('Learning evidence summary')}</caption><thead><tr><th scope="col" className="p-3">{t('Objective')}</th><th scope="col" className="p-3">{t('Checks')}</th><th scope="col" className="p-3">{aggregate ? t('Review signals') : t('Evidence stage')}</th></tr></thead><tbody>{rows.map((row, index) => <tr className="border-t" key={row.conceptId}><th scope="row" className="p-3 font-normal"><span>{row.title || t('Learning objective {number}',{number:index+1})}</span><details className="v-muted mt-1"><summary>{t('Reference')}</summary><span className="break-all">{row.conceptId}</span></details></th><td className="p-3">{row.total ? t('{correct} / {total} correct',{correct:row.correct,total:row.total}) : t('No checks yet')}</td><td className="p-3">{aggregate ? (row.needsReview === 1 ? t('1 learner') : t('{count} learners',{count:row.needsReview})) : t(row.stage)}</td></tr>)}</tbody></table></div>;
}

function TeacherPanel({ ctx, locale, view, onSelect, onNotice }) {
  const t = roleMentorCopy(locale);
  const formId = useId();
  const [mode, setMode] = useState('lesson');
  const [brief, setBrief] = useState('');
  const [title, setTitle] = useState('');
  const [outline, setOutline] = useState('');
  const [reply, setReply] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => { request.current?.abort(); setBusy(false); setReply(null); }, [view.aggregate?.classId]);
  async function prepare(event) {
    event.preventDefault();
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setError(''); onNotice(''); setReply(null); setBusy(true);
    try {
      const result = await requestTeacherSupport({ ...ctx, signal: controller.signal }, { mode, brief, classId: view.aggregate?.classId });
      if (controller.signal.aborted) return;
      setReply(result);
      if (result.status === 'ready') setOutline(result.text);
    } catch (failure) { if (failure.name !== 'AbortError') setError(failure.message); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  function save() {
    try { saveTeacherPreparation(ctx, { title, body: outline || brief }); setError(''); onNotice(t('Preparation saved locally as an unreviewed draft. Open Prepare to review and assign it.')); }
    catch (failure) { setError(failure.message); }
  }
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-medium">{t('Teaching workspace')}</h2><Link className="v-button" to="/dashboard/growth">{t('Your own growth')}</Link></div>
    <p className="v-muted">{t('Class evidence and your own learning stay separate. Private learner doubts are not included.')}</p>
    {view.classes.length ? <><label className="block text-sm mt-4">{t('Assigned class')}<select className="v-field mt-2" value={view.aggregate?.classId || ''} onChange={e => onSelect(e.target.value)}>{view.classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><p className="v-muted mt-4">{t('{pending} submissions awaiting review · {shared} of {total} learners have shared evidence.',{pending:view.aggregate.pendingSubmissions,shared:view.aggregate.participatingLearners,total:view.aggregate.learnerCount})}</p><EvidenceTable locale={locale} rows={view.aggregate.concepts} aggregate /></> : <p className="v-notice mt-4">{t('No assigned class is connected. You can prepare independently or connect a class.')}</p>}
    <div className="flex flex-wrap gap-3 mt-4"><Link className="v-button" to="/dashboard/classes">{t('Open classes')}</Link><Link className="v-button" to="/dashboard/prepare">{view.preparation ? t('Continue preparation') : t('Open lesson drafts')}</Link></div>
    <details className="mt-5"><summary className="cursor-pointer py-3 font-medium">{t('Quiz, lesson plan, and teacher coach')}</summary><p className="v-muted mb-4">{t('Requests use the teaching-service connection. No model answer is generated while it is disconnected. Only class-level evidence is attached.')}</p><form onSubmit={prepare} className="space-y-4"><label className="block text-sm">{t('What are you preparing?')}<select className="v-field mt-2" value={mode} disabled={busy} onChange={e => { setMode(e.target.value); setReply(null); }}><option value="lesson">{t('Lesson plan')}</option><option value="quiz">{t('Quiz for class review needs')}</option><option value="coach">{t('Teacher coach')}</option></select></label><label className="block text-sm" htmlFor={`${formId}-brief`}>{t('Objective or question')}</label><textarea id={`${formId}-brief`} className="v-field" rows={3} maxLength={6000} required value={brief} onChange={e => setBrief(e.target.value)} placeholder={t('Describe the objective and the support you need. Avoid personal learner details.')}/><button className="v-button" disabled={busy}>{busy ? t('Requesting…') : t('Request teaching support')}</button></form>{reply && <p className="v-notice mt-4 whitespace-pre-wrap" role="status">{reply.text}</p>}<div className="space-y-4 mt-5"><label className="block text-sm">{t('Draft title')}<input className="v-field mt-2" value={title} maxLength={160} onChange={e => setTitle(e.target.value)}/></label><label className="block text-sm">{t('Editable preparation')}<textarea className="v-field mt-2" value={outline} onChange={e => setOutline(e.target.value)} rows={5} maxLength={16000} placeholder={t('Write your own outline here, or review a connected service response before saving.')}/></label><button className="v-button" onClick={save} disabled={!title.trim() || !(outline || brief).trim()}>{t('Save preparation draft')}</button></div></details>
    <p className="v-muted mt-4">{t('Your own growth: {count} capabilities with recorded activity. This is separate from the class summary.',{count:view.own.concepts.length})}</p>
    {error && <p role="alert" className="v-notice v-error mt-4" lang="en">{error}</p>}
  </>;
}

function ParentPanel({ locale, view, onSelect }) {
  const t = roleMentorCopy(locale);
  return <>
    <h2 className="text-lg font-medium">{t('Your child’s week')}</h2><p className="v-muted mt-2">{t('Read-only progress shared with you. Private questions, conversations, notes, and drafts remain private.')}</p>
    {view.children.length ? <><label className="block text-sm mt-4">{t('Child')}<select className="v-field mt-2" value={view.summary?.childId || ''} onChange={e => onSelect(e.target.value)}>{view.children.map(child => <option value={child.id} key={child.id}>{child.name}</option>)}</select></label><p className="v-muted mt-4">{t(view.summary.period)} · {t('Rule-based observations from shared evidence, not a model assessment.')}</p>{view.summary.observations.length ? <ul className="list-disc pl-5 mt-4 space-y-3">{view.summary.observations.map(observation => <li key={observation.id} className="text-sm" lang="en">{observation.text}</li>)}</ul> : <p className="v-notice mt-4">{t('No learning activity has been shared for this period. Ask what they would like to explore, without treating missing activity as a problem.')}</p>}<p className="v-muted mt-4">{t('{count} completed applications in this period.',{count:view.summary.completedApplications})}</p><details className="mt-4"><summary className="cursor-pointer py-3 font-medium">{t('Shared learning evidence')}</summary><EvidenceTable locale={locale} rows={view.summary.concepts}/></details></> : <p className="v-notice mt-4">{t('No child currently shares a progress summary with you. A pending, expired, or revoked connection does not grant access.')}</p>}
    {view.connections.some(item => item.status !== 'active') && <details className="mt-4"><summary className="cursor-pointer py-3">{t('Connection status')}</summary>{view.connections.filter(item => item.status !== 'active').map(item => <p className="v-muted py-2" key={item.id}>{item.name}: {t(item.status)}</p>)}</details>}
    <div className="flex flex-wrap gap-3 mt-4"><Link className="v-button" to="/dashboard/child">{t('Manage child connections')}</Link>{view.summary && <Link className="v-button" to={`/dashboard/reports?child=${encodeURIComponent(view.summary.childId)}`}>{t('Open shared report')}</Link>}</div>
  </>;
}

function ProfessionalPanel({ ctx, locale, view, onNotice }) {
  const t = roleMentorCopy(locale);
  const [title, setTitle] = useState(view.goal?.title || '');
  const [body, setBody] = useState(view.goal?.body || '');
  const [goalId, setGoalId] = useState(view.goal?.id);
  const [error, setError] = useState('');
  const needsReview = view.own.concepts.filter(concept => concept.total > 0 && concept.accuracy !== null && concept.accuracy < 0.7);
  function save(event) {
    event.preventDefault();
    try { const goal = saveCareerTarget(ctx, { id: goalId, title, body }); setGoalId(goal.id); setError(''); onNotice(t('Career target saved locally in your personal workspace.')); }
    catch (failure) { setError(failure.message); }
  }
  return <>
    <h2 className="text-lg font-medium">{t('Your next capability')}</h2><p className="v-muted mt-2">{t('Your target guides the same learning, practice, and building loop. An employer does not gain access to this personal evidence.')}</p>
    <p className="v-notice mt-4">{needsReview.length ? t('{count} capabilities have checks to revisit. This is based on recorded attempts, not an assessment of your employability.',{count:needsReview.length}) : view.own.concepts.length ? t('No review gap is indicated by your recorded checks. Keep building varied evidence.') : t('No skill gap has been assessed yet. Choose a target, then build evidence through practice and projects.')}</p>
    <details className="mt-4"><summary className="cursor-pointer py-3 font-medium">{view.goal ? t('Update career target') : t('Set a career target')}</summary><form className="space-y-4 mt-3" onSubmit={save}><label className="block text-sm">{t('Capability or role target')}<input className="v-field mt-2" value={title} maxLength={160} required onChange={e => setTitle(e.target.value)} placeholder={t('For example, make better data-informed decisions')}/></label><label className="block text-sm">{t('What would useful progress look like?')}<textarea className="v-field mt-2" rows={3} maxLength={6000} value={body} onChange={e => setBody(e.target.value)}/></label><button className="v-button" type="submit">{t('Save target')}</button></form></details>
    {needsReview.length > 0 && <details className="mt-3"><summary className="cursor-pointer py-3">{t('Capabilities to revisit')}</summary><EvidenceTable locale={locale} rows={needsReview}/></details>}
    <div className="flex flex-wrap gap-3 mt-4"><Link className="v-button" to="/dashboard/build">{t('Build your portfolio')}</Link><Link className="v-button" to="/dashboard/career">{t('Career workspace')}</Link></div><p className="v-muted mt-3">{t('{count} saved projects · Share work explicitly; do not paste confidential employer material.',{count:view.projects})}</p>{error && <p role="alert" className="v-notice v-error mt-4" lang="en">{error}</p>}
  </>;
}

function OrganizationPanel({ locale, view }) {
  const t = roleMentorCopy(locale);
  const aggregate = view.aggregate;
  const setup = [{label:'People and permissions',detail:['{count} active memberships',{count:aggregate.activeMemberships}],path:'/dashboard/people'},{label:'Cohorts',detail:['{count} saved groups',{count:view.cohorts}],path:'/dashboard/cohorts'},{label:'Curriculum',detail:['{count} reviewed mappings',{count:view.curriculum}],path:'/dashboard/curriculum'},{label:'Teaching library',detail:['{count} reviewed resources',{count:view.library}],path:'/dashboard/library'}];
  return <>
    <h2 className="text-lg font-medium">{t('Organization readiness')}</h2><p className="v-muted mt-2">{t('Operational totals and explicitly shared class evidence only. Individual personal learning is not included.')}</p>
    <p className="v-muted mt-3">{t(aggregate.period)}. {t('Learner denominator: distinct active enrollments in linked classes.')}</p>
    <dl className="grid grid-cols-2 gap-4 mt-5"><div><dt className="v-muted">{t('Linked classes')}</dt><dd className="text-xl">{aggregate.classCount}</dd></div><div><dt className="v-muted">{t('Active memberships')}</dt><dd className="text-xl">{aggregate.activeMemberships}</dd></div><div><dt className="v-muted">{t('Learners in linked classes')}</dt><dd className="text-xl">{aggregate.learnerCount}</dd></div><div><dt className="v-muted">{t('Submissions awaiting review')}</dt><dd className="text-xl">{aggregate.pendingSubmissions ?? t('Hidden')}</dd></div></dl>
    <div className="mt-5">{setup.map(item => <div key={item.path} className="v-list-row"><div><p className="text-sm font-medium">{t(item.label)}</p><p className="v-muted">{t(item.detail[0],item.detail[1])}</p></div><Link className="v-button" to={item.path}>{t('Open')}<span className="sr-only"> {t(item.label)}</span></Link></div>)}</div>{aggregate.suppressed&&<p className="v-muted mt-4" role="status">{t('Learning totals are hidden for groups or concepts with fewer than {count} contributing learners.',{count:aggregate.minimumGroupSize})}</p>}<details className="mt-4"><summary className="cursor-pointer py-3 font-medium">{t('Shared concept totals')}</summary><EvidenceTable locale={locale} rows={aggregate.concepts} aggregate/></details>
  </>;
}

function RolePanel({ ctx, locale }) {
  const ui = workspacePresentationCopy(locale);
  const t = roleMentorCopy(locale);
  const [selection, setSelection] = useState('');
  const [revision, setRevision] = useState(0);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    const names = ['visionary:v2-change', 'visionary:mentor-change', 'storage', 'visionary:workspace-change'];
    names.forEach(name => window.addEventListener(name, refresh));
    return () => names.forEach(name => window.removeEventListener(name, refresh));
  }, []);
  const query = useQuery({ queryKey: ['role-mentor', ctx.personId, ctx.workspaceId, ctx.role, ctx.locale, selection, revision], queryFn: ({ signal }) => getRoleMentorView({ ...ctx, signal }, selection), retry: false, gcTime: 0 });
  if (query.error) return <section className="v-home-module"><h2 className="text-lg font-medium">{t('Summary unavailable')}</h2><p className="v-notice v-error mt-3" role="alert" lang="en">{query.error.message}</p><div className="flex flex-wrap gap-3 mt-4"><button className="v-button" onClick={() => query.refetch()}>{t('Retry')}</button>{selection && <button className="v-button" onClick={() => setSelection('')}>{t('Choose an available connection')}</button>}<Link className="v-button" to="/dashboard/connections">{t('Manage connections')}</Link></div></section>;
  if (!query.data) return <section className="v-home-module" role="status" aria-busy="true">{t('Loading your authorized summary…')}</section>;
  return <details className="v-details v-role-overview"><summary>{ui(ctx.role)}</summary><div className="v-details-body">{query.data.role === 'teacher' && <TeacherPanel ctx={ctx} locale={locale} view={query.data} onSelect={setSelection} onNotice={setNotice}/>} {query.data.role === 'parent' && <ParentPanel locale={locale} view={query.data} onSelect={setSelection}/>} {query.data.role === 'professional' && <ProfessionalPanel ctx={ctx} locale={locale} view={query.data} onNotice={setNotice}/>} {query.data.role === 'organization' && <OrganizationPanel locale={locale} view={query.data}/>} {notice && <p role="status" className="v-notice mt-4">{notice}</p>}<p className="v-muted mt-5">{t('Local preview · No live model, identity verification, or cloud synchronization.')}</p></div></details>;
}

export default function RoleMentorPanel({ ctx, locale = 'en' }) {
  if (!ctx || ctx.role === 'student') return null;
  return <RolePanel key={`${ctx.personId}:${ctx.workspaceId}:${ctx.role}:${ctx.locale}`} ctx={ctx} locale={locale}/>;
}
