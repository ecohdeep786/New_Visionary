import SpotIllustration from '@/components/landing/SpotIllustration';
import { projectCopy } from '@/lib/projectCopy';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Save, ArrowLeft, ArrowUpRight, FileText, History, Share2, Shapes } from 'lucide-react';
import WorkspaceIntro from '@/components/dashboard/WorkspaceIntro';
import ProjectCriteria from '@/components/dashboard/ProjectCriteria';
import ParentProjectSharing from '@/components/dashboard/ParentProjectSharing';
import ProfessionalPortfolioReview from '@/components/dashboard/ProfessionalPortfolioReview';
import { useWorkspace } from '@/hooks/useWorkspace';
import { saveArtifact, artifactRevision, snapshot, shareArtifact, sharedArtifacts, stopSharingArtifact, visibleRelationships } from '@/services/workspaceService';
import { recordProjectSave, validateProjectCompletion } from '@/services/learningPipelineService';
import { saveArtifactEditorDraft, getArtifactEditorDraft, clearArtifactEditorDraft, recoverArtifactEditorDraft, hasUnsavedArtifactEdits } from '@/services/artifactEditorDraft';
import { downloadText } from './WorkspaceTools';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
export default function ArtifactStudio() {
  const scope=useWorkspace();
  return <ArtifactWorkspace key={`${scope.ctx?.personId}:${scope.ctx?.workspaceId}`} scope={scope}/>;
}
function ArtifactWorkspace({scope}) {
  const {
    ctx,
    data,
    error,
    workspace,
    refresh
  } = scope;
  const locale = data?.preferences.interfaceLocale || 'en';
  const t = projectCopy(locale);
  const [draft, setDraft] = useState(null);
  const [baseRevision, setBaseRevision] = useState('');
  const [conflict, setConflict] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [showVersions, setShowVersions] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [parentSharing, setParentSharing] = useState(false);
  const [recipient, setRecipient] = useState('');
  const noticeFailed=Boolean(notice&&typeof notice==='object'&&notice.error);
const noticeText=noticeFailed?notice.message:typeof notice==='object'?t(notice.key,notice.params):t(notice);
const noticeLocale=noticeFailed?'en':typeof notice==='object'||t(notice)!==notice?locale:'en';
const [params] = useSearchParams();
  const artifactId = params.get('artifact');
  function openSavedArtifact(target) {
    setConflict(false);
    setBaseRevision(artifactRevision(target));
    try {
      const cached = getArtifactEditorDraft(ctx, target.id);
      if (cached && hasUnsavedArtifactEdits(target, cached)) {
        setBaseRevision(cached.baseRevision || 'unknown');
        setDraft(recoverArtifactEditorDraft(target, cached));
        setRecovered(true);
        setNotice('Unsaved project edits were recovered from this device. Choose Save to keep them.');
      } else {
        setDraft(target);
        setRecovered(false);
      }
    } catch (cause) {
      setDraft(target);
      setRecovered(false);
      setNotice({
        error: true,
        message: cause.message
      });
    }
  }
  useEffect(() => {
    setDraft(null);
    setRecovered(false);
    setNotice('');
    setConflict(false);
    setShowVersions(false);
    setSharing(false);
    setParentSharing(false);
    setRecipient('');
    setFilter('all');
    setQuery('');
  }, [ctx?.personId, ctx?.workspaceId]);
  useEffect(() => {
    if (!artifactId || !data || !ctx) return;
    const target = data.artifacts.find(a => a.id === artifactId);
    if (target) openSavedArtifact(target);else setNotice('This project is not available in this workspace. Your other projects remain unchanged.');
  }, [artifactId, ctx?.workspaceId, !!data]);
  useEffect(() => {
    if (!draft?.id || !ctx) return;
    try {
      saveArtifactEditorDraft(ctx, draft, baseRevision);
    } catch (cause) {
      setNotice({
        error: true,
        message: cause.message
      });
    }
  }, [draft, baseRevision, ctx?.workspaceId]);
  if (error) return <div className="v-page" lang={locale}><h1 className="v-title">{t('Projects unavailable')}</h1><p className="v-notice v-error" role="alert" lang="en">{error}</p><button className="v-button mt-4" onClick={refresh}>{t('Retry projects')}</button>{draft && <button className="v-button mt-4 ml-3" onClick={() => downloadText('visionary-project-edits.json', JSON.stringify(draft, null, 2), 'application/json')}>{t('Export current project edits')}</button>}</div>;
  if (!ctx || !data) return <div className="v-page" lang={locale} role="status">{t("Loading projects\u2026")}</div>;
  let received, connections;
  try {
    received = sharedArtifacts(ctx);
    connections = visibleRelationships(ctx).filter(r => r.status === 'active' && r.scope.includes('shared-resources'));
  } catch (failure) {
    return <div className="v-page" lang={locale}><h1 className="v-title">{t('Projects unavailable')}</h1><p className="v-notice v-error" role="alert" lang="en">{failure.message}</p><button className="v-button mt-4" onClick={refresh}>{t('Retry projects')}</button>{draft && <button className="v-button mt-4 ml-3" onClick={() => downloadText('visionary-project-edits.json', JSON.stringify(draft, null, 2), 'application/json')}>{t('Export current project edits')}</button>}</div>;
  }
  const rows = data.artifacts.filter(a => (filter === 'all' || a.status === filter) && a.title.toLowerCase().includes(query.toLowerCase()));
  function save() {
    try {
      validateProjectCompletion(draft);
      const saved = saveArtifact(ctx, draft, baseRevision);
      setDraft(saved);
      setBaseRevision(artifactRevision(saved));
      setConflict(false);
      recordProjectSave(ctx, saved);
      try {
        clearArtifactEditorDraft(ctx, saved.id);
      } catch {/* The saved project remains authoritative. */}
      setRecovered(false);
      setNotice(saved.status === 'completed' && saved.conceptId ? 'Project saved. Unverified application evidence recorded; a single project does not establish mastery.' : 'Project saved on this device.');
      return saved;
    } catch (e) {
      if (e.name === 'ArtifactConflictError') setConflict(true);
      setNotice({
        error: true,
        message: e.message
      });
    }
  }
  if (draft) return <div className="v-page" lang={locale}><h1 className="v-title">{t('Your project')}</h1><header className="flex flex-wrap items-center justify-between gap-3"><button className="v-button" onClick={() => {
        if (save()) setDraft(null);
      }}><ArrowLeft size={16} />{t("Projects")}</button><div className="flex flex-wrap gap-2"><button className="v-button" onClick={() => setShowVersions(true)}><History size={16} />{t("Versions")}</button><button className="v-button" onClick={() => {
          if (save()) setSharing(true);
        }}><Share2 size={16} />{t("Share")}</button>{ctx.role === 'student' && !workspace?.organizationId && <button className="v-button" onClick={() => {
          if (save()) setParentSharing(true);
        }}>{t("Share summary with parent")}</button>}<button className="v-button primary" onClick={save}><Save size={16} />{t("Save")}</button></div></header>{ctx.role==='student'&&workspace?.organizationId&&<p className="v-notice">{t('Parent summaries are available from your personal learner workspace. Work projects and goals remain here.')}</p>}{conflict && <section className="v-card" aria-labelledby="project-conflict"><h2 id="project-conflict" className="text-lg font-medium">{t("A newer project version is saved")}</h2><p className="v-muted mt-3">{t("Your edits remain here. Review the saved version, then keep it or save your edits as a separate private draft. A recovered copy does not add learning evidence or restore sharing.")}</p><details className="mt-4"><summary className="cursor-pointer">{t("Review latest saved version")}</summary><p className="mt-3 whitespace-pre-wrap text-sm">{data.artifacts.find(item => item.id === draft.id)?.body || t("No saved text available.")}</p></details><div className="mt-4 flex flex-wrap gap-3"><button className="v-button" onClick={() => {
          try {
            const latest = snapshot(ctx).artifacts.find(item => item.id === draft.id);
            if (!latest) throw Error('The saved project is unavailable. Your editor remains open.');
            clearArtifactEditorDraft(ctx, draft.id);
            setDraft(latest);
            setBaseRevision(artifactRevision(latest));
            setConflict(false);
            setRecovered(false);
            setNotice('Latest saved version loaded; previous editor edits discarded.');
          } catch (error) {
            setNotice({
              error: true,
              message: error.message
            });
          }
        }}>{t("Use latest and discard my edits")}</button><button className="v-button primary" onClick={() => {
          try {
            const copy = saveArtifact(ctx, {
              title: draft.title + ' (recovered copy)',
              body: draft.body,
              milestones: [false, false, false],
              status: 'in-progress',
              projectBrief: draft.projectBrief,
              rubric: draft.rubric
            });
            setDraft(copy);
            setBaseRevision(artifactRevision(copy));
            setConflict(false);
            setRecovered(false);
            try {
              clearArtifactEditorDraft(ctx, draft.id);
              setNotice('Your edits were saved as a separate private draft. The newer original was kept.');
            } catch {
              setNotice('Your separate private draft is saved. The old editor backup could not be removed; it may appear again when you open the original.');
            }
          } catch (error) {
            setNotice({
              error: true,
              message: error.message
            });
          }
        }}>{t("Save my edits as a separate project")}</button></div></section>}{recovered && <div className="v-notice" role="status"><p>{t("Unsaved project edits were recovered from this device. Save to keep them in your project.")}</p><button className="v-button mt-3" onClick={() => {
        try {
          clearArtifactEditorDraft(ctx, draft.id);
          const saved = data.artifacts.find(item => item.id === draft.id);
          if (saved) {
            setDraft(saved);
            setBaseRevision(artifactRevision(saved));
            setConflict(false);
            setRecovered(false);
            setNotice("Recovered edits discarded; the last saved project is shown.");
          }
        } catch (cause) {
          setNotice({
            error: true,
            message: cause.message
          });
        }
      }}>{t("Discard recovered edits")}</button></div>}<p className="v-notice">{ctx.role === 'professional' ? workspace?.organizationId ? t("This company workspace is separate from your personal projects. Share only reviewed work with an accepted connection.") : t("Keep workplace-sensitive information out of this local preview. Personal work is not shared with an employer automatically.") : t("Your project is private until you choose an accepted connection and confirm sharing.")}</p>{draft.projectBrief && <section className="v-card"><h2 className="text-lg font-medium">{t("Project brief")}</h2><p className="v-muted mt-2">{draft.projectBrief}</p></section>}<label className="text-sm">{t("Project title")}<input aria-label={t("Project title")} className="v-field mt-2" value={draft.title} onChange={e => setDraft({
        ...draft,
        title: e.target.value
      })} /></label><div className="v-project-workbench grid gap-6 xl:grid-cols-[1.2fr_1fr]"><section className="v-project-document-editor"><label className="text-sm">{t("Your working document")}<textarea aria-label={t("Your working document")} className="v-field mt-2 min-h-[360px] leading-7" value={draft.body} onChange={e => setDraft({
            ...draft,
            body: e.target.value
          })} onBlur={save} placeholder={t("Describe your idea, evidence, experiments and reflection\u2026")} /></label><p className="v-muted mt-2">{t("Saves when you leave the editor or choose Save.")}</p></section><section className="v-card v-project-preview"><h2 className="mb-5 text-lg font-medium">{t("Artifact preview")}</h2><h3 className="mb-4 text-base font-medium">{draft.title || t("Untitled project")}</h3><p className="whitespace-pre-wrap break-words text-sm leading-7">{draft.body || t("Your document preview appears here as you write.")}</p></section></div><ProjectCriteria locale={locale} rubric={draft.rubric} onChange={(id, value) => setDraft({
      ...draft,
      rubric: {
        ...draft.rubric,
        responses: {
          ...draft.rubric.responses,
          [id]: value
        }
      }
    })} /><section className="v-card"><h2 className="mb-4 text-lg font-medium">{t("Milestones")}</h2>{['Define the idea and success criteria', 'Create and check your artifact', 'Reflect on evidence and limitations'].map((label, i) => <label key={label} className="my-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={draft.milestones[i]} onChange={e => {
          const milestones = [...draft.milestones];
          milestones[i] = e.target.checked;
          setDraft({
            ...draft,
            milestones
          });
        }} />{t(label)}</label>)}<label className="mt-5 block max-w-sm text-sm">{t("Project status")}<select className="v-field mt-2" aria-label={t('Project status')} value={draft.status} onChange={e => setDraft({
          ...draft,
          status: e.target.value
        })}><option value="draft">{t("Draft")}</option><option value="in-progress">{t("In progress")}</option><option value="completed">{t("Completed")}</option></select></label></section>{ctx.role === 'professional' && <ProfessionalPortfolioReview key={`${ctx.personId}:${ctx.workspaceId}:${draft.id}`} ctx={ctx} artifact={draft} locale={data.preferences.interfaceLocale || 'en'} onPrepare={save} onHistoryRefresh={portfolioReviews => setDraft(current => ({...current, portfolioReviews}))} onChange={(saved, message) => {
      setDraft(saved);
      setBaseRevision(artifactRevision(saved));
      setNotice(message);
    }} />}<div className="flex flex-wrap gap-3">{draft.learningSessionId && <Link className="v-button" to={`/dashboard/learn?unit=${encodeURIComponent(draft.learningSessionId)}`}>{t("Return to learning unit")}</Link>}<Link className="v-button" to={draft.learningSessionId ? `/dashboard/ask?learning=${encodeURIComponent(draft.learningSessionId)}` : '/dashboard/ask'} onClick={event => { if (!save()) event.preventDefault(); }} state={{
        initialQuestion: `Help me improve my project: ${draft.title}`
      }}>{t("Ask Visionary")}</Link><button className="v-button" onClick={() => downloadText(`${draft.title || 'visionary-project'}.md`, `# ${draft.title}\n\n${draft.body}`)}>{t("Export Markdown")}</button>{draft.journeyId && <Link className="v-button" to={`/dashboard/home?journey=${draft.journeyId}`}>{t("Revisit the concept")}</Link>}</div>{notice && <p role={noticeFailed?"alert":"status"} lang={noticeLocale} className={noticeFailed?"v-notice v-error":"v-notice"}>{noticeText}</p>}
 <Dialog open={showVersions} onOpenChange={setShowVersions}><DialogContent lang={locale} className="max-h-[80dvh] overflow-y-auto"><DialogTitle>{t("Saved versions")}</DialogTitle><DialogDescription>{t("Restore a previous local version. Save afterward to keep the restored document.")}</DialogDescription>{draft.versions.length ? draft.versions.map((v, i) => <button className="v-list-row text-left text-sm" key={i} onClick={() => {
          setDraft({
            ...draft,
            body: v.body
          });
          setShowVersions(false);
          setNotice('Previous version restored in the editor. Save to keep it.');
        }}>{new Date(v.at).toLocaleString(locale)}<span>{t("Restore")}</span></button>) : <p className="v-muted">{t("Edit and save again to create a previous version.")}</p>}</DialogContent></Dialog>
 <Dialog open={sharing} onOpenChange={setSharing}><DialogContent lang={locale} className="max-h-[85dvh] overflow-y-auto bg-white"><DialogTitle>{t("Share this artifact?")}</DialogTitle><DialogDescription>{t("Review the exact saved copy and recipient. Later edits stay private until you share an updated copy. This local preview does not verify an employer.")}</DialogDescription><label className="text-sm">{t("Accepted connection")}<select className="v-field mt-2" aria-label={t('Accepted connection')} value={recipient} onChange={e => setRecipient(e.target.value)}><option value="">{t("Choose a connection")}</option>{connections.map(r => <option key={r.id} value={r.from === ctx.personId ? r.to : r.from}>{r.name}</option>)}</select></label>{recipient && <section className="v-card mt-4 bg-white"><h3 className="text-sm font-medium">{t("Copy to share with")}{connections.find(r => (r.from === ctx.personId ? r.to : r.from) === recipient)?.name || t("this connection")}</h3><p className="v-muted mt-2 break-all">{t("Saved version:")}{draft.updatedAt}</p><p className="mt-3 text-sm font-medium">{draft.title}</p><p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-sm">{draft.body || t("This project has no content yet.")}</p><p className="v-muted mt-3">{t("Only this title and document are included. Goals, conversations and other projects stay private.")}</p></section>}{draft.visibility === 'shared' && <button className="v-button" onClick={() => {
          try {
            stopSharingArtifact(ctx, draft.id);
            setDraft({
              ...draft,
              visibility: 'private',
              sharedWith: []
            });
            setNotice('Sharing stopped. Your own document is retained.');
          } catch (e) {
            setNotice({
              error: true,
              message: e.message
            });
          }
        }}>{t("Stop sharing with everyone")}</button>}{!connections.length && <Link className="v-button" to="/dashboard/privacy">{t("Manage connections")}</Link>}<button disabled={!recipient || !draft.id || !draft.body.trim()} className="v-button primary" onClick={() => {
          try {
            const shared = shareArtifact(ctx, draft.id, recipient, JSON.stringify([draft.updatedAt, draft.title, draft.body]));
            setDraft(shared);
            setSharing(false);
            setNotice('Saved copy shared with this accepted local connection. Later edits need a new confirmation.');
          } catch (e) {
            setNotice({
              error: true,
              message: e.message
            });
          }
        }}>{t("Confirm sharing")}</button>{notice && <p role={noticeFailed?"alert":"status"} lang={noticeLocale} className={noticeFailed?"v-notice v-error":"v-muted"}>{noticeText}</p>}</DialogContent></Dialog><ParentProjectSharing locale={locale} ctx={ctx} artifact={draft} open={parentSharing} onOpenChange={setParentSharing} onHistoryRefresh={parentSummaries=>setDraft(current=>({...current,parentSummaries}))} onChange={(saved, message) => {
      setDraft(saved);
      setBaseRevision(artifactRevision(saved));
      setNotice(message);
    }} /></div>;
  return <div className="v-page" lang={locale}><WorkspaceIntro eyebrow={t("Create and reflect")} title={t("Build something of your own")} description={t("Bring your ideas, evidence, and experiments together.")} icon={Shapes}><button className="v-button primary" onClick={() => {
        try {
          const newProject = saveArtifact(ctx, {
            title: 'Untitled project',
            body: '',
            milestones: [false, false, false],
            status: 'draft'
          });
          setDraft(newProject);
          setBaseRevision(artifactRevision(newProject));
          setConflict(false);
          setRecovered(false);
          setNotice('New draft saved on this device.');
        } catch (cause) {
          setNotice({
            error: true,
            message: cause.message
          });
        }
      }}><Plus size={16} />{t("New project")}</button></WorkspaceIntro><p className="v-muted">{t("Start from a verified learning unit for a connected project, or make a private blank project.")}{" "}<Link className="v-action-link" to="/dashboard/learn">{t("Open learning outline")}</Link></p>{notice && <p role={noticeFailed?"alert":"status"} lang={noticeLocale} className={noticeFailed?"v-notice v-error":"v-notice"}>{noticeText}</p>}<div className="flex flex-wrap gap-3"><label className="min-w-0 flex-1"><span className="sr-only">{t("Search projects")}</span><input className="v-field" placeholder={t("Search projects")} value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label={t("Project status")} className="v-field !w-auto" value={filter} onChange={e => setFilter(e.target.value)}>{['all', 'draft', 'in-progress', 'completed'].map(v => <option key={v} value={v}>{t(v)}</option>)}</select></div><section className="v-card"><h2 className="mb-3 text-lg font-medium">{t("My projects")}</h2>{rows.length ? <div className="v-project-grid">{rows.map(a => <button className="v-project-card" key={a.id} onClick={() => {
        setNotice('');
        openSavedArtifact(a);
      }}><span className="v-project-document" aria-hidden="true"><FileText size={44} strokeWidth={1.4}/></span><div><h3>{a.title}</h3><p className="v-project-card-meta"><span>{t(a.status)}</span><span aria-hidden="true">·</span><span>{t(a.visibility)}</span></p></div><span className="v-project-card-action">{t("Open")}<ArrowUpRight size={18} aria-hidden="true"/></span></button>)}</div> : <div className="v-workspace-empty"><SpotIllustration subject={query || filter !== 'all' ? "compass" : "build"} className="v-empty-illustration v-empty-illustration-square"/><p className="font-medium">{query || filter !== 'all' ? t("No matching projects") : t("Your first project starts here")}</p><p className="v-muted mt-2">{query || filter !== 'all' ? t("Try a different title or status.") : t("Create a blank project or continue a concept in Learn. Your work stays yours.")}</p></div>}</section>{received.length > 0 && <section className="v-card"><h2 className="text-lg font-medium">{t("Shared with me")}</h2>{received.map(a => <details className="mt-5" key={a.id}><summary className="cursor-pointer text-sm font-medium">{a.title} · {a.from}</summary><p className="v-muted mt-2">{a.sharedVersion ? t('Shared saved copy from {date}. Later private edits are not shown.', {
            date: a.sharedVersion
          }) : t("Earlier local share. Re-share to create a fixed saved copy.")}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-7">{a.body}</p></details>)}</section>}</div>;
}
