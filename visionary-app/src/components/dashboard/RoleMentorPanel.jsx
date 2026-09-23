import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRoleMentorView, requestTeacherSupport, saveCareerTarget, saveTeacherPreparation } from '@/services/roleMentorService';

function EvidenceTable({ rows, aggregate = false }) {
  if (!rows.length) return <p className="v-muted">No shared evidence yet. An empty history is not a learning gap.</p>;
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">{aggregate ? 'Shared concept evidence, aggregated without learner identities' : 'Learning evidence summary'}</caption><thead><tr><th scope="col" className="p-3">Objective</th><th scope="col" className="p-3">Checks</th><th scope="col" className="p-3">{aggregate ? 'Review signals' : 'Evidence stage'}</th></tr></thead><tbody>{rows.map((row, index) => <tr className="border-t" key={row.conceptId}><th scope="row" className="p-3 font-normal"><span>{row.title || `Learning objective ${index + 1}`}</span><details className="v-muted mt-1"><summary>Reference</summary><span className="break-all">{row.conceptId}</span></details></th><td className="p-3">{row.total ? `${row.correct} / ${row.total} correct` : 'No checks yet'}</td><td className="p-3">{aggregate ? `${row.needsReview} learner${row.needsReview === 1 ? '' : 's'}` : row.stage}</td></tr>)}</tbody></table></div>;
}

function TeacherPanel({ ctx, view, onSelect, onNotice }) {
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
    try { saveTeacherPreparation(ctx, { title, body: outline || brief }); setError(''); onNotice('Preparation saved locally as an unreviewed draft. Open Prepare to review and assign it.'); }
    catch (failure) { setError(failure.message); }
  }
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-medium">Teaching workspace</h2><Link className="v-button" to="/dashboard/growth">Your own growth</Link></div>
    <p className="v-muted">Class evidence and your own learning stay separate. Private learner doubts are not included.</p>
    {view.classes.length ? <><label className="block text-sm mt-4">Assigned class<select className="v-field mt-2" value={view.aggregate?.classId || ''} onChange={e => onSelect(e.target.value)}>{view.classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><p className="v-muted mt-4">{view.aggregate.pendingSubmissions} submissions awaiting review · {view.aggregate.participatingLearners} of {view.aggregate.learnerCount} learners have shared evidence.</p><EvidenceTable rows={view.aggregate.concepts} aggregate /></> : <p className="v-notice mt-4">No assigned class is connected. You can prepare independently or connect a class.</p>}
    <div className="flex flex-wrap gap-3 mt-4"><Link className="v-button" to="/dashboard/classes">Open classes</Link><Link className="v-button" to="/dashboard/prepare">{view.preparation ? 'Continue preparation' : 'Open lesson drafts'}</Link></div>
    <details className="mt-5"><summary className="cursor-pointer py-3 font-medium">Quiz, lesson plan, and teacher coach</summary><p className="v-muted mb-4">Requests use the teaching-service connection. No model answer is generated while it is disconnected. Only class-level evidence is attached.</p><form onSubmit={prepare} className="space-y-4"><label className="block text-sm">What are you preparing?<select className="v-field mt-2" value={mode} disabled={busy} onChange={e => { setMode(e.target.value); setReply(null); }}><option value="lesson">Lesson plan</option><option value="quiz">Quiz for class review needs</option><option value="coach">Teacher coach</option></select></label><label className="block text-sm" htmlFor={`${formId}-brief`}>Objective or question</label><textarea id={`${formId}-brief`} className="v-field" rows={3} maxLength={6000} required value={brief} onChange={e => setBrief(e.target.value)} placeholder="Describe the objective and the support you need. Avoid personal learner details."/><button className="v-button" disabled={busy}>{busy ? 'Requesting…' : 'Request teaching support'}</button></form>{reply && <p className="v-notice mt-4 whitespace-pre-wrap" role="status">{reply.text}</p>}<div className="space-y-4 mt-5"><label className="block text-sm">Draft title<input className="v-field mt-2" value={title} maxLength={160} onChange={e => setTitle(e.target.value)}/></label><label className="block text-sm">Editable preparation<textarea className="v-field mt-2" value={outline} onChange={e => setOutline(e.target.value)} rows={5} maxLength={16000} placeholder="Write your own outline here, or review a connected service response before saving."/></label><button className="v-button" onClick={save} disabled={!title.trim() || !(outline || brief).trim()}>Save preparation draft</button></div></details>
    <p className="v-muted mt-4">Your own growth: {view.own.concepts.length} capabilities with recorded activity. This is separate from the class summary.</p>
    {error && <p role="alert" className="v-notice v-error mt-4">{error}</p>}
  </>;
}

function ParentPanel({ view, onSelect }) {
  return <>
    <h2 className="text-lg font-medium">Your child’s week</h2><p className="v-muted mt-2">Read-only progress shared with you. Private questions, conversations, notes, and drafts remain private.</p>
    {view.children.length ? <><label className="block text-sm mt-4">Child<select className="v-field mt-2" value={view.summary?.childId || ''} onChange={e => onSelect(e.target.value)}>{view.children.map(child => <option value={child.id} key={child.id}>{child.name}</option>)}</select></label><p className="v-muted mt-4">{view.summary.period} · Rule-based observations from shared evidence, not a model assessment.</p>{view.summary.observations.length ? <ul className="list-disc pl-5 mt-4 space-y-3">{view.summary.observations.map(observation => <li key={observation.id} className="text-sm">{observation.text}</li>)}</ul> : <p className="v-notice mt-4">No learning activity has been shared for this period. Ask what they would like to explore, without treating missing activity as a problem.</p>}<p className="v-muted mt-4">{view.summary.completedApplications} completed applications in this period.</p><details className="mt-4"><summary className="cursor-pointer py-3 font-medium">Shared learning evidence</summary><EvidenceTable rows={view.summary.concepts}/></details></> : <p className="v-notice mt-4">No child currently shares a progress summary with you. A pending, expired, or revoked connection does not grant access.</p>}
    {view.connections.some(item => item.status !== 'active') && <details className="mt-4"><summary className="cursor-pointer py-3">Connection status</summary>{view.connections.filter(item => item.status !== 'active').map(item => <p className="v-muted py-2" key={item.id}>{item.name}: {item.status}</p>)}</details>}
    <div className="flex flex-wrap gap-3 mt-4"><Link className="v-button" to="/dashboard/child">Manage child connections</Link>{view.summary && <Link className="v-button" to={`/dashboard/reports?child=${encodeURIComponent(view.summary.childId)}`}>Open shared report</Link>}</div>
  </>;
}

function ProfessionalPanel({ ctx, view, onNotice }) {
  const [title, setTitle] = useState(view.goal?.title || '');
  const [body, setBody] = useState(view.goal?.body || '');
  const [goalId, setGoalId] = useState(view.goal?.id);
  const [error, setError] = useState('');
  const needsReview = view.own.concepts.filter(concept => concept.total > 0 && concept.accuracy !== null && concept.accuracy < 0.7);
  function save(event) {
    event.preventDefault();
    try { const goal = saveCareerTarget(ctx, { id: goalId, title, body }); setGoalId(goal.id); setError(''); onNotice('Career target saved locally in your personal workspace.'); }
    catch (failure) { setError(failure.message); }
  }
  return <>
    <h2 className="text-lg font-medium">Your next capability</h2><p className="v-muted mt-2">Your target guides the same learning, practice, and building loop. An employer does not gain access to this personal evidence.</p>
    <p className="v-notice mt-4">{needsReview.length ? `${needsReview.length} capabilities have checks to revisit. This is based on recorded attempts, not an assessment of your employability.` : view.own.concepts.length ? 'No review gap is indicated by your recorded checks. Keep building varied evidence.' : 'No skill gap has been assessed yet. Choose a target, then build evidence through practice and projects.'}</p>
    <details className="mt-4"><summary className="cursor-pointer py-3 font-medium">{view.goal ? 'Update career target' : 'Set a career target'}</summary><form className="space-y-4 mt-3" onSubmit={save}><label className="block text-sm">Capability or role target<input className="v-field mt-2" value={title} maxLength={160} required onChange={e => setTitle(e.target.value)} placeholder="For example, make better data-informed decisions"/></label><label className="block text-sm">What would useful progress look like?<textarea className="v-field mt-2" rows={3} maxLength={6000} value={body} onChange={e => setBody(e.target.value)}/></label><button className="v-button" type="submit">Save target</button></form></details>
    {needsReview.length > 0 && <details className="mt-3"><summary className="cursor-pointer py-3">Capabilities to revisit</summary><EvidenceTable rows={needsReview}/></details>}
    <div className="flex flex-wrap gap-3 mt-4"><Link className="v-button" to="/dashboard/build">Build your portfolio</Link><Link className="v-button" to="/dashboard/career">Career workspace</Link></div><p className="v-muted mt-3">{view.projects} saved projects · Share work explicitly; do not paste confidential employer material.</p>{error && <p role="alert" className="v-notice v-error mt-4">{error}</p>}
  </>;
}

function OrganizationPanel({ view }) {
  const aggregate = view.aggregate;
  const setup = [{label:'People and permissions',detail:`${aggregate.activeMemberships} active memberships`,path:'/dashboard/people'},{label:'Cohorts',detail:`${view.cohorts} saved groups`,path:'/dashboard/cohorts'},{label:'Curriculum',detail:`${view.curriculum} reviewed mappings`,path:'/dashboard/curriculum'},{label:'Teaching library',detail:`${view.library} reviewed resources`,path:'/dashboard/library'}];
  return <>
    <h2 className="text-lg font-medium">Organization readiness</h2><p className="v-muted mt-2">Operational totals and explicitly shared class evidence only. Individual personal learning is not included.</p>
    <dl className="grid grid-cols-2 gap-4 mt-5"><div><dt className="v-muted">Linked classes</dt><dd className="text-xl">{aggregate.classCount}</dd></div><div><dt className="v-muted">Active memberships</dt><dd className="text-xl">{aggregate.activeMemberships}</dd></div><div><dt className="v-muted">Learners in linked classes</dt><dd className="text-xl">{aggregate.learnerCount}</dd></div><div><dt className="v-muted">Submissions awaiting review</dt><dd className="text-xl">{aggregate.pendingSubmissions}</dd></div></dl>
    <div className="mt-5">{setup.map(item => <div key={item.path} className="v-list-row"><div><p className="text-sm font-medium">{item.label}</p><p className="v-muted">{item.detail}</p></div><Link className="v-button" to={item.path}>Open<span className="sr-only"> {item.label}</span></Link></div>)}</div><details className="mt-4"><summary className="cursor-pointer py-3 font-medium">Shared concept totals</summary><EvidenceTable rows={aggregate.concepts} aggregate/></details>
  </>;
}

function RolePanel({ ctx }) {
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
  if (query.error) return <section className="v-card"><h2 className="text-lg font-medium">Summary unavailable</h2><p className="v-notice v-error mt-3" role="alert">{query.error.message}</p><div className="flex flex-wrap gap-3 mt-4"><button className="v-button" onClick={() => query.refetch()}>Retry</button>{selection && <button className="v-button" onClick={() => setSelection('')}>Choose an available connection</button>}<Link className="v-button" to="/dashboard/connections">Manage connections</Link></div></section>;
  if (!query.data) return <section className="v-card" role="status" aria-busy="true">Loading your authorized summary…</section>;
  return <section className="v-card">{query.data.role === 'teacher' && <TeacherPanel ctx={ctx} view={query.data} onSelect={setSelection} onNotice={setNotice}/>} {query.data.role === 'parent' && <ParentPanel view={query.data} onSelect={setSelection}/>} {query.data.role === 'professional' && <ProfessionalPanel ctx={ctx} view={query.data} onNotice={setNotice}/>} {query.data.role === 'organization' && <OrganizationPanel view={query.data}/>} {notice && <p role="status" className="v-notice mt-4">{notice}</p>}<p className="v-muted mt-5">Local preview · No live model, identity verification, or cloud synchronization.</p></section>;
}

export default function RoleMentorPanel({ ctx }) {
  if (!ctx || ctx.role === 'student') return null;
  return <RolePanel key={`${ctx.personId}:${ctx.workspaceId}:${ctx.role}:${ctx.locale}`} ctx={ctx}/>;
}
