import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { careerTargetRevision, getCareerPath, saveCareerTarget } from '@/services/roleMentorService';
import { getResourceEditorDraft, saveResourceEditorDraft, clearResourceEditorDraft } from '@/services/resourceEditorDraft';
import { downloadText } from '@/lib/downloadText';

const backupKey = 'new:career-direction';

export default function ProfessionalCareer() {
  const scope = useWorkspace();
  return <CareerWorkspace key={`${scope.ctx?.personId}:${scope.ctx?.workspaceId}`} scope={scope}/>;
}

function CareerWorkspace({ scope }) {
  const { ctx, revision, error: workspaceError, workspace } = scope;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [conceptId, setConceptId] = useState('');
  const [base, setBase] = useState('null');
  const [goalId, setGoalId] = useState();
  const [recovered, setRecovered] = useState(false);
  const [ready, setReady] = useState(false);
  const [backupError, setBackupError] = useState('');
  const [backupBlocked, setBackupBlocked] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const result = useMemo(() => {
    if (!ctx || ctx.role !== 'professional') return { path: null, error: '' };
    try { return { path: getCareerPath(ctx), error: '' }; }
    catch (failure) { return { path: null, error: failure.message }; }
  }, [ctx?.personId, ctx?.workspaceId, ctx?.role, revision]);
  const path = result.path;
  useEffect(() => {
    if (!ctx || ctx.role !== 'professional' || ready) return;
    try {
      const saved = getCareerPath(ctx).goal;
      let restored = null;
      try {
        restored = getResourceEditorDraft(ctx, backupKey);
        if (restored && (typeof restored.baseRevision !== 'string' || typeof restored.draft.conceptId !== 'string' ||
          restored.draft.title.length > 160 || restored.draft.body.length > 6000 ||
          (restored.draft.id !== undefined && typeof restored.draft.id !== 'string'))) {
          throw Error('Career edits could not be recovered. Their original backup is retained.');
        }
      } catch (failure) { restored = null; setBackupError(failure.message); setBackupBlocked(true); }
      setTitle(restored?.draft.title ?? saved?.title ?? '');
      setBody(restored?.draft.body ?? saved?.body ?? '');
      setConceptId(restored?.draft.conceptId ?? saved?.conceptId ?? '');
      setGoalId(restored ? restored.draft.id : saved?.id);
      setBase(restored?.baseRevision ?? careerTargetRevision(saved));
      setRecovered(Boolean(restored)); setReady(true);
    } catch (failure) { setError(failure.message); }
  }, [ctx?.personId, ctx?.workspaceId, ctx?.role, ready, revision]);

  function edit(field, value) {
    const draft = { id: goalId, title, body, conceptId, [field]: value };
    if (field === 'title') setTitle(value);
    if (field === 'body') setBody(value);
    if (field === 'conceptId') setConceptId(value);
    setNotice('');
    if (backupBlocked) return;
    try { saveResourceEditorDraft(ctx, backupKey, draft, base); setBackupError(''); }
    catch (failure) { setBackupError(failure.message); }
  }

  function loadLatest() {
    try {
      const latest = getCareerPath(ctx).goal;
      clearResourceEditorDraft(ctx, backupKey);
      setTitle(latest?.title || ''); setBody(latest?.body || ''); setConceptId(latest?.conceptId || '');
      setGoalId(latest?.id); setBase(careerTargetRevision(latest));
      setError(''); setBackupError(''); setBackupBlocked(false); setRecovered(false); setNotice('Loaded the latest saved direction.');
    } catch (failure) { setError(failure.message); }
  }

  function exportEdits() {
    try {
      downloadText('career-direction-edits.json', JSON.stringify({ title, body, conceptId }, null, 2), 'application/json');
      setNotice('Career edits exported. This does not save or share your direction.'); setError('');
    } catch (failure) { setError(failure.message); }
  }

  if (workspaceError || result.error) return <div className="v-page" role="alert">{workspaceError || result.error}</div>;
  if (!ctx) return <div className="v-page" role="status">Opening your career workspace…</div>;
  if (ctx.role !== 'professional') return <div className="v-page" role="alert">Open a professional workspace to view this path.</div>;

  function save(event) {
    event.preventDefault();
    setError(''); setNotice('');
    try {
      const saved = saveCareerTarget(ctx, { id: goalId, title, body, conceptId }, base);
      setGoalId(saved.id); setBase(careerTargetRevision(saved)); setRecovered(false);
      try { if (!backupBlocked) { clearResourceEditorDraft(ctx, backupKey); setBackupError(''); } }
      catch (failure) { setBackupError(`Your direction was saved, but its editor backup remains: ${failure.message}`); }
      setNotice('Career target saved on this device. Learning evidence and portfolio work remain private unless you choose to share.');
    } catch (failure) { setError(failure.message); }
  }

  const conflict = ready && base !== careerTargetRevision(path?.goal);
  const target = path?.target;
  const sponsored = Boolean(workspace?.organizationId);
  const related = path?.portfolio.filter(item => item.conceptId && item.conceptId === path.goal?.conceptId) || [];
  const other = path?.portfolio.filter(item => !related.some(match => match.id === item.id)) || [];
  return <div className="v-page">
    <header><p className="v-home-eyebrow">{sponsored ? `${workspace.name} · Work workspace` : 'Personal professional workspace'}</p><h1 className="v-title mt-2">Your next capability</h1><p className="v-muted mt-2">Set a purpose, practise one skill, then keep work you can explain. Saved work stays in this workspace until you explicitly share an artifact.</p></header>
    <aside className="v-notice" aria-label="Workspace boundary"><p className="text-sm font-medium">{sponsored ? 'Company learning space' : 'Your personal professional space'}</p><p className="v-muted mt-2">{sponsored ? 'This company workspace has its own goal, evidence and projects. Your personal work was not copied here. If the organization connection ends, return to your personal workspace using the workspace switcher.' : 'Your goal, evidence and projects are personal. Joining a company creates a separate workspace; it does not copy this work or grant the company access. Sharing a portfolio project requires your separate confirmation.'}</p><Link className="v-button mt-3" to="/dashboard/connections">Review connections</Link></aside>
    <section className="v-card"><h2 className="text-lg font-medium">1. Set your direction</h2><p className="v-muted mt-2">A target is your choice, not a prediction about your career.</p>
      {recovered && <p className="v-notice mt-4" role="status">Unsaved career edits recovered on this device. Save direction to keep them.</p>}
      {backupError && <p className="v-notice v-error mt-4" role="alert">{backupError} Your current fields remain available to export.</p>}
      {conflict && <section className="v-notice mt-4" aria-label="Career target conflict"><h3 className="font-medium">A newer direction is saved</h3><p className="v-muted mt-2">Your current edits are retained. Review the saved version before discarding them.</p><details className="mt-3"><summary>Latest saved direction</summary><p className="mt-2">{path?.goal?.title || 'No active direction'}</p><p className="whitespace-pre-wrap mt-2">{path?.goal?.body}</p></details></section>}
      <form onSubmit={save} className="mt-5 grid gap-4"><label className="text-sm">Capability or role target<input className="v-field mt-2" maxLength={160} required value={title} onChange={event => edit('title', event.target.value)} placeholder="For example, make evidence-based decisions"/></label><label className="text-sm">What would useful progress look like?<textarea className="v-field mt-2" rows={3} maxLength={6000} value={body} onChange={event => edit('body', event.target.value)} placeholder="Describe a work problem or outcome without confidential details."/></label><label className="text-sm">Connect to a capability you started<select className="v-field mt-2" value={conceptId} onChange={event => edit('conceptId', event.target.value)}><option value="">Not linked yet</option>{conceptId && !path?.capabilities.some(item => item.conceptId === conceptId) && <option value={conceptId}>Previously linked capability unavailable</option>}{path?.capabilities.map(item => <option key={item.conceptId} value={item.conceptId}>{item.title}</option>)}</select></label><div className="flex flex-wrap items-center gap-3"><button className="v-button primary" disabled={!ready || conflict}>Save direction</button><button className="v-button" type="button" onClick={exportEdits}>Export current edits</button><button className="v-button" type="button" onClick={loadLatest}>Load saved direction and discard edits</button><Link className="v-button" to="/dashboard/learn">Explore capabilities<ArrowRight size={16}/></Link></div></form>
      {error && <p className="v-notice v-error mt-4" role="alert">{error}</p>}{notice && <p className="v-notice mt-4" role="status">{notice}</p>}
    </section>
    <section className="v-card"><h2 className="text-lg font-medium">2. Build skill evidence</h2>{target ? <div className="v-list-row"><div><p className="text-sm font-medium">{target.title}</p><p className="v-muted">{target.evidence ? `${target.evidence.stage} · ${target.evidence.correct}/${target.evidence.total} recorded checks` : 'No recorded check yet'} · Activity: {target.activityStage}</p></div><Link className="v-button" to={`/dashboard/learn?unit=${encodeURIComponent(target.unitId)}`}>Continue<span className="sr-only"> {target.title}</span></Link></div> : <p className="v-muted mt-3">{path?.goal ? 'Your target is saved. Start a capability in Learn, then connect it above. No skill gap is inferred without evidence.' : 'Start with a target or explore an authored sample. A model response is not connected yet.'}</p>}{path?.capabilities.length > (target ? 1 : 0) && <details className="mt-4"><summary className="cursor-pointer text-sm font-medium">Other started capabilities ({path.capabilities.length - (target ? 1 : 0)})</summary>{path.capabilities.filter(item => item.conceptId !== target?.conceptId).map(item => <div className="v-list-row" key={item.conceptId}><div><p className="text-sm">{item.title}</p><p className="v-muted">{item.evidence?.stage || 'No evidence yet'}</p></div><Link className="v-button" to={`/dashboard/learn?unit=${encodeURIComponent(item.unitId)}`}>Open</Link></div>)}</details>}</section>
    <section className="v-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-medium">3. Show your work</h2><p className="v-muted mt-2">Completed work is application evidence, not automatic mastery or a credential.</p></div><Link className="v-button" to="/dashboard/build">Open Build</Link></div>{related.length ? related.map(item => <div className="v-list-row" key={item.id}><div><p className="text-sm font-medium">{item.title}</p><p className="v-muted">{item.status} · {item.visibility} · {item.review}</p></div><Link className="v-button" to={`/dashboard/build?artifact=${encodeURIComponent(item.id)}`}>Open</Link></div>) : <p className="v-muted mt-4">No project is connected to this target yet. Finish a comprehension check and practice step to start its guided project.</p>}{other.length > 0 && <details className="mt-4"><summary className="cursor-pointer text-sm font-medium">Other portfolio projects ({other.length})</summary>{other.map(item => <div className="v-list-row" key={item.id}><div><p className="text-sm">{item.title}</p><p className="v-muted">{item.status} · {item.visibility} · {item.review}</p></div><Link className="v-button" to={`/dashboard/build?artifact=${encodeURIComponent(item.id)}`}>Open</Link></div>)}</details>}</section>
    <p className="v-muted">Local preview · No live model, hiring assessment, or cloud sync. Do not include confidential employer material.</p>
  </div>;
}
