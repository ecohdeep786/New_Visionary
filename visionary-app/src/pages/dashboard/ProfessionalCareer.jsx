import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { getCareerPath, saveCareerTarget } from '@/services/roleMentorService';

export default function ProfessionalCareer() {
  const { ctx, revision, error: workspaceError, workspace } = useWorkspace();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const result = useMemo(() => {
    if (!ctx || ctx.role !== 'professional') return { path: null, error: '' };
    try { return { path: getCareerPath(ctx), error: '' }; }
    catch (failure) { return { path: null, error: failure.message }; }
  }, [ctx?.personId, ctx?.workspaceId, ctx?.role, revision]);
  const path = result.path;
  useEffect(() => {
    setTitle(path?.goal?.title || '');
    setBody(path?.goal?.body || '');
    setConceptId(path?.goal?.conceptId || '');
  }, [ctx?.workspaceId, path?.goal?.id, path?.goal?.updatedAt]);

  if (workspaceError || result.error) return <div className="v-page" role="alert">{workspaceError || result.error}</div>;
  if (!ctx) return <div className="v-page" role="status">Opening your career workspace…</div>;
  if (ctx.role !== 'professional') return <div className="v-page" role="alert">Open a professional workspace to view this path.</div>;

  function save(event) {
    event.preventDefault();
    setError(''); setNotice('');
    try {
      saveCareerTarget(ctx, { id: path?.goal?.id, title, body, conceptId });
      setNotice('Career target saved on this device. Learning evidence and portfolio work remain private unless you choose to share.');
    } catch (failure) { setError(failure.message); }
  }

  const target = path?.target;
  const related = path?.portfolio.filter(item => item.conceptId && item.conceptId === path.goal?.conceptId) || [];
  const other = path?.portfolio.filter(item => !related.some(match => match.id === item.id)) || [];
  return <div className="v-page">
    <header><p className="v-home-eyebrow">{workspace?.organizationId ? 'Work organization · separate learning space' : 'Personal professional workspace'}</p><h1 className="v-title mt-2">Your next capability</h1><p className="v-muted mt-2">Set a purpose, practise one skill, then keep work you can explain. No employer can see this personal path automatically.</p></header>
    <section className="v-card"><h2 className="text-lg font-medium">1. Set your direction</h2><p className="v-muted mt-2">A target is your choice, not a prediction about your career.</p>
      <form onSubmit={save} className="mt-5 grid gap-4"><label className="text-sm">Capability or role target<input className="v-field mt-2" maxLength={160} required value={title} onChange={event => setTitle(event.target.value)} placeholder="For example, make evidence-based decisions"/></label><label className="text-sm">What would useful progress look like?<textarea className="v-field mt-2" rows={3} maxLength={6000} value={body} onChange={event => setBody(event.target.value)} placeholder="Describe a work problem or outcome without confidential details."/></label><label className="text-sm">Connect to a capability you started<select className="v-field mt-2" value={conceptId} onChange={event => setConceptId(event.target.value)}><option value="">Not linked yet</option>{path?.capabilities.map(item => <option key={item.conceptId} value={item.conceptId}>{item.title}</option>)}</select></label><div className="flex flex-wrap items-center gap-3"><button className="v-button primary">Save direction</button><Link className="v-button" to="/dashboard/learn">Explore capabilities<ArrowRight size={16}/></Link></div></form>
      {error && <p className="v-notice v-error mt-4" role="alert">{error}</p>}{notice && <p className="v-notice mt-4" role="status">{notice}</p>}
    </section>
    <section className="v-card"><h2 className="text-lg font-medium">2. Build skill evidence</h2>{target ? <div className="v-list-row"><div><p className="text-sm font-medium">{target.title}</p><p className="v-muted">{target.evidence ? `${target.evidence.stage} · ${target.evidence.correct}/${target.evidence.total} recorded checks` : 'No recorded check yet'} · Activity: {target.activityStage}</p></div><Link className="v-button" to={`/dashboard/learn?unit=${encodeURIComponent(target.unitId)}`}>Continue<span className="sr-only"> {target.title}</span></Link></div> : <p className="v-muted mt-3">{path?.goal ? 'Your target is saved. Start a capability in Learn, then connect it above. No skill gap is inferred without evidence.' : 'Start with a target or explore an authored sample. A model response is not connected yet.'}</p>}{path?.capabilities.length > (target ? 1 : 0) && <details className="mt-4"><summary className="cursor-pointer text-sm font-medium">Other started capabilities ({path.capabilities.length - (target ? 1 : 0)})</summary>{path.capabilities.filter(item => item.conceptId !== target?.conceptId).map(item => <div className="v-list-row" key={item.conceptId}><div><p className="text-sm">{item.title}</p><p className="v-muted">{item.evidence?.stage || 'No evidence yet'}</p></div><Link className="v-button" to={`/dashboard/learn?unit=${encodeURIComponent(item.unitId)}`}>Open</Link></div>)}</details>}</section>
    <section className="v-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-medium">3. Show your work</h2><p className="v-muted mt-2">Completed work is application evidence, not automatic mastery or a credential.</p></div><Link className="v-button" to="/dashboard/build">Open Build</Link></div>{related.length ? related.map(item => <div className="v-list-row" key={item.id}><div><p className="text-sm font-medium">{item.title}</p><p className="v-muted">{item.status} · {item.visibility}</p></div><Link className="v-button" to={`/dashboard/build?artifact=${encodeURIComponent(item.id)}`}>Open</Link></div>) : <p className="v-muted mt-4">No project is connected to this target yet. Finish a comprehension check and practice step to start its guided project.</p>}{other.length > 0 && <details className="mt-4"><summary className="cursor-pointer text-sm font-medium">Other portfolio projects ({other.length})</summary>{other.map(item => <div className="v-list-row" key={item.id}><div><p className="text-sm">{item.title}</p><p className="v-muted">{item.status} · {item.visibility}</p></div><Link className="v-button" to={`/dashboard/build?artifact=${encodeURIComponent(item.id)}`}>Open</Link></div>)}</details>}</section>
    <p className="v-muted">Local preview · No live model, hiring assessment, or cloud sync. Do not include confidential employer material.</p>
  </div>;
}
