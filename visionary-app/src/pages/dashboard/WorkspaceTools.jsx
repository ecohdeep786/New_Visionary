import { teacherCopy } from '@/lib/teacherCopy';
import { privacyCopy } from '@/lib/privacyCopy';
import { Link } from 'react-router-dom';
import LearningProgress from './LearningProgress';
import WorkspaceNotifications from '@/components/dashboard/WorkspaceNotifications';
import StageProfileEditor from '@/components/dashboard/StageProfileEditor';
import { downloadText } from '@/lib/downloadText';
import AssignLesson from '@/components/dashboard/AssignLesson';
import ProfessionalCareer from './ProfessionalCareer';
import LessonChecksEditor from '@/components/dashboard/LessonChecksEditor';
import LessonObjectivePicker from '@/components/dashboard/LessonObjectivePicker';
import LessonObjectivePreview from '@/components/dashboard/LessonObjectivePreview';
import LocalDataPreview from '@/components/dashboard/LocalDataPreview';
import ParentReport from './ParentReport';
import ParentNotifications from './ParentNotifications';
import OrganizationAudit from './OrganizationAudit';
import OrganizationNotifications from './OrganizationNotifications';
import OrganizationContent from './OrganizationContent';
import TeacherContentInbox from '@/components/dashboard/TeacherContentInbox';
import { saveResourceEditorDraft, getResourceEditorDraft, clearResourceEditorDraft } from '@/services/resourceEditorDraft';
import { useEffect, useState } from 'react';
import { Plus, BookOpen, Save, Search, Archive } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { saveResource, resourceRevision, archiveResource, updatePreferences, exportWorkspace } from '@/services/workspaceService';
import { listJourneys } from '@/services/journeys';
import { getRecentContext, getWeeklyObservations, deleteMemory } from '@/services/mentorStateService';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
const configs = {
  prepare: {
    title: 'Prepare a lesson',
    description: 'Start with an objective. Shape the explanation, then review it before sharing.',
    kind: 'lesson',
    empty: 'Your next lesson starts here',
    action: 'New lesson'
  },
  library: {
    title: 'Your library',
    description: 'Keep reviewed lessons and resources together.',
    kind: 'lesson',
    empty: 'Build your resource library',
    action: 'New resource'
  },
  career: {
    title: 'Your next career step',
    description: 'Connect a goal to evidence you can explain and work you can show.',
    kind: 'goal',
    empty: 'Choose a skill worth building',
    action: 'Add career goal'
  },
  cohorts: {
    title: 'Cohorts',
    description: 'Organize a class, team, or learning group without mixing personal work.',
    kind: 'cohort',
    empty: 'Create your first cohort',
    action: 'Create cohort'
  },
  growth: {
    title: 'Teacher Growth',
    description: 'Your own learning, separate from class administration.',
    kind: 'goal',
    empty: 'What would you like to develop?',
    action: 'Add growth goal'
  }
};
export { downloadText } from '@/lib/downloadText';
export default function WorkspaceTools({
  area
}) {
  if (area === 'career') return <ProfessionalCareer />;
  return <WorkspaceToolsContent area={area} />;
}
function WorkspaceToolsContent({
  area
}) {
  const {
    ctx,
    data,
    error,
    refresh
  } = useWorkspace();
  const interfaceLocale = data?.preferences.interfaceLocale || 'en';
  const copy = teacherCopy(interfaceLocale);
  const config = configs[area];
  const [draft, setDraft] = useState(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [preview, setPreview] = useState(false);
  const [baseRevision, setBaseRevision] = useState(undefined);
  const [recovered, setRecovered] = useState(false);
  const [conflict, setConflict] = useState(false);
  useEffect(() => {
    if (!draft || !ctx) return;
    const saved = data?.resources.find(row => row.id === draft.id);
    if (saved && resourceRevision(saved) === resourceRevision(draft) && baseRevision === resourceRevision(saved)) return;
    try {
      saveResourceEditorDraft(ctx, draft.id || 'new:' + draft.kind, draft, baseRevision);
    } catch (cause) {
      setFormError(cause.message);
    }
  }, [draft, baseRevision, ctx?.workspaceId, ctx?.personId]);
  function openResource(resource) {
    setFormError('');
    setConflict(false);
    setRecovered(false);
    const key = resource.id || 'new:' + resource.kind;
    try {
      const backup = getResourceEditorDraft(ctx, key);
      if (backup) {
        setDraft(backup.draft);
        setBaseRevision(backup.baseRevision ?? (resource.id ? 'unknown' : undefined));
        setRecovered(true);
      } else {
        setDraft(resource);
        setBaseRevision(resource.id ? resourceRevision(resource) : undefined);
      }
    } catch (cause) {
      setDraft(resource);
      setBaseRevision(resource.id ? resourceRevision(resource) : undefined);
      setFormError(cause.message);
    }
  }
  if (error) return <div className="v-page" lang={data?.preferences.interfaceLocale || 'en'}><h1 className="v-title">{privacyCopy(data?.preferences.interfaceLocale || 'en')('Workspace unavailable')}</h1><p className="v-notice v-error mt-4" role="alert" lang="en">{error}</p><button className="v-button mt-4" onClick={refresh}>{privacyCopy(data?.preferences.interfaceLocale || 'en')('Retry workspace')}</button></div>;
  if (!ctx || !data) return <div role="status" className="v-page">{copy("Loading workspace\u2026")}</div>;
  if (area === 'progress') return <LearningProgress key={ctx.workspaceId} data={data} ctx={ctx} />;
  if (area === 'reports') return <ParentReport ctx={ctx} locale={data.preferences.interfaceLocale || 'en'} />;
  if (area === 'notifications' && ctx.role === 'parent') return <ParentNotifications ctx={ctx} data={data} />;
  if (area === 'notifications' && ctx.role === 'organization') return <OrganizationNotifications ctx={ctx} data={data} />;
  if (area === 'notifications') return <WorkspaceNotifications key={ctx.workspaceId} ctx={ctx} data={data} />;
  if (area === 'personalization') return <Trust ctx={ctx} data={data} area={area} />;
  if (area === 'privacy') return <><Trust ctx={ctx} data={data} area={area} /><div className="v-page"><MemoryControl ctx={ctx} locale={data.preferences.interfaceLocale || 'en'} /><LocalDataPreview key={ctx.personId} ctx={ctx} locale={data.preferences.interfaceLocale || 'en'} /></div></>;
  if (area === 'audit') return <OrganizationAudit key={ctx.personId + ':' + ctx.workspaceId} ctx={ctx} locale={data.preferences.interfaceLocale || 'en'} />;
  if (area === 'library' && ctx.role === 'organization') return <OrganizationContent ctx={ctx} data={data} />;
  if (!config) return <div className="v-page">{copy("This workspace is unavailable.")}</div>;
  const rows = data.resources.filter(r => r.kind === config.kind && r.title.toLowerCase().includes(query.toLowerCase()));
  function create() {
    openResource({
      title: '',
      body: '',
      kind: config.kind,
      status: 'draft',
      audience: 'Personal'
    });
  }
  function save() {
    try {
      saveResource(ctx, draft, baseRevision);
      try {
        clearResourceEditorDraft(ctx, draft.id || 'new:' + draft.kind);
        setNotice('Saved to this workspace.');
      } catch {
        setNotice('Saved to this workspace. The old editor backup could not be removed and may appear again.');
      }
      setDraft(null);
      setRecovered(false);
      setConflict(false);
    } catch (e) {
      if (e.name === 'ResourceConflictError') setConflict(true);
      setFormError(e.message);
    }
  }
  return <div className="v-page" lang={interfaceLocale}><header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="v-title">{copy(config.title)}</h1><p className="v-muted mt-2">{copy(config.description)}</p></div><button className="v-button primary" onClick={create}><Plus size={17} />{copy(config.action)}</button></header>{notice && <p role="status" className="v-notice">{copy(notice)}</p>}{formError && !draft && <p role="alert" className="v-notice v-error" lang="en">{formError}</p>}
  {area === 'prepare' && ctx.role === 'teacher' && <TeacherContentInbox locale={interfaceLocale} ctx={ctx} onOpen={openResource} />}{(area === 'prepare' || area === 'growth' || area === 'career') && <section><h2 className="mb-4 text-base font-medium">{copy("Start from a curated journey")}</h2><div className="grid gap-3 lg:grid-cols-3">{listJourneys(ctx.locale).map(j => <button className="v-card text-left" key={j.id} onClick={() => {
          openResource({
            title: j.title,
            body: `Objective\n${j.objective}\n\nExplanation\n${j.explanation}\n\nActivity\n${j.exploration}\n\nCheck\n${j.questions[0].prompt}\n\nSource\nVisionary demonstration content — review before assigning.`,
            kind: config.kind,
            status: 'draft',
            audience: 'Personal'
          });
          setFormError('');
        }}><BookOpen size={20} className="mb-4 text-[#4285F4]" /><p className="text-sm font-medium" lang={ctx.locale}>{j.title}</p><p className="v-muted mt-2">{copy("Editable demo outline")}</p></button>)}</div></section>}
  <label className="flex max-w-md items-center gap-3"><Search size={18} /><span className="sr-only">{copy("Search saved items")}</span><input className="v-field" value={query} onChange={e => setQuery(e.target.value)} placeholder={copy("Search saved items")} /></label>
  <section className="v-card">{rows.length ? rows.map(r => <div key={r.id} className="v-list-row"><button className="min-w-0 flex-1 text-left" onClick={() => {
          openResource(r);
        }}><p className="text-sm font-medium">{r.title}</p><p className="v-muted">{copy(r.status)} · {r.audience}</p></button><button className="v-button !px-3" aria-label={copy('{action} {title}', {
          action: copy(r.status === 'archived' ? 'Restore' : 'Archive'),
          title: r.title
        })} onClick={() => {
          try {
            archiveResource(ctx, r.id);
            setFormError('');
            setNotice(r.status === 'archived' ? 'Restored to drafts.' : 'Archived. Use Restore to bring it back.');
          } catch (cause) {
            setFormError(cause.message);
          }
        }}><Archive size={17} /></button></div>) : <div className="py-10 text-center"><h2 className="text-lg font-medium">{copy(query ? 'No matching items' : config.empty)}</h2><p className="v-muted mt-2">{copy(query ? 'Try another search.' : 'Use a clear goal and save a first draft. You can refine it at any time.')}</p></div>}</section>
  <Dialog open={!!draft} onOpenChange={open => {
      if (!open) setDraft(null);
    }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl" lang={interfaceLocale}><DialogTitle>{copy('{action} {kind}', {
            action: copy(draft?.id ? 'Edit' : 'Create'),
            kind: copy(config.kind)
          })}</DialogTitle><DialogDescription>{copy(config.kind === 'lesson' ? 'Review objectives, content, misconceptions, checks, language, and sources before assigning.' : 'Your changes stay in this local workspace.')}</DialogDescription>{draft && <>{recovered && <p className="v-notice" role="status">{copy("Unsaved resource edits were recovered from this device. Save to keep them.")}</p>}{conflict && <section className="v-card"><h2 className="text-base font-medium">{copy("A newer resource version is saved")}</h2><p className="v-muted mt-2">{copy("Your edits are backed up separately. Export them or review the saved version before continuing.")}</p><details className="mt-3"><summary className="cursor-pointer">{copy("Review latest resource")}</summary><p className="mt-3 whitespace-pre-wrap">{data.resources.find(row => row.id === draft.id)?.body}</p></details><button className="v-button mt-3" onClick={() => {
              try {
                clearResourceEditorDraft(ctx, draft.id);
                const latest = data.resources.find(row => row.id === draft.id);
                if (!latest) throw Error("The latest resource is unavailable.");
                setDraft(latest);
                setBaseRevision(resourceRevision(latest));
                setConflict(false);
                setRecovered(false);
                setFormError("");
              } catch (cause) {
                setFormError(cause.message);
              }
            }}>{copy("Use latest and discard my edits")}</button></section>}{draft.sourceSnapshot && <p className="v-notice">{copy("Adapted from organization revision")}{draft.sourceSnapshot.revision} · {draft.sourceSnapshot.source} · {draft.sourceSnapshot.language}{copy(". Your edits and review apply to this teacher draft; the delivered original is retained.")}</p>}<label className="text-sm">{copy("Title")}<input className="v-field mt-2" value={draft.title} onChange={e => setDraft({
              ...draft,
              title: e.target.value
            })} /></label><label className="text-sm">{copy(config.kind === 'cohort' ? 'Purpose, members, schedule and curriculum' : 'Outline and notes')}<textarea aria-label={copy(config.kind === 'cohort' ? 'Purpose, members, schedule and curriculum' : 'Outline and notes')} className="v-field mt-2" rows={10} value={draft.body} onChange={e => setDraft({
              ...draft,
              body: e.target.value
            })} /></label>{config.kind === 'lesson' && <LessonObjectivePicker interfaceLocale={interfaceLocale} ctx={ctx} objective={draft.objectiveSnapshot} onChange={objectiveSnapshot => setDraft(current => current ? {
            ...current,
            objectiveSnapshot,
            status: 'draft'
          } : current)} />}{config.kind === 'lesson' && <LessonChecksEditor locale={data.preferences.interfaceLocale || 'en'} checks={draft.checks || []} onChange={checks => setDraft({
            ...draft,
            checks
          })} />}<div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">{copy("Status")}<select aria-label={copy("Status")} className="v-field mt-2" value={draft.status} onChange={e => setDraft({
                ...draft,
                status: e.target.value
              })}>{['draft', 'reviewed', 'archived'].map(s => <option key={s} value={s}>{copy(s)}</option>)}</select></label><label className="text-sm">{copy("Audience")}<input className="v-field mt-2" value={draft.audience} onChange={e => setDraft({
                ...draft,
                audience: e.target.value
              })} /></label></div>{formError && <p role="alert" className="v-notice v-error" lang="en">{formError}</p>}<div className="flex flex-wrap gap-3"><button className="v-button primary" onClick={save}><Save size={16} />{copy("Save draft")}</button><button className="v-button" onClick={() => setPreview(true)}>{copy("Preview as learner")}</button><button className="v-button" onClick={() => downloadText(`${draft.title || 'resource'}.txt`, draft.body)}>{copy("Export")}</button></div>{config.kind === 'lesson' && draft.id && draft.status === 'reviewed' && <AssignLesson ctx={ctx} resource={draft} locale={data.preferences.interfaceLocale || 'en'} />}</>}</DialogContent></Dialog>
  <Dialog open={preview} onOpenChange={setPreview}><DialogContent className="max-h-[85dvh] overflow-y-auto" lang={interfaceLocale}><DialogTitle>{draft?.title || copy('Learner preview')}</DialogTitle><DialogDescription>{copy("Preview only. This does not record learner evidence.")}</DialogDescription><p className="whitespace-pre-wrap text-base leading-8">{draft?.body}</p><LessonObjectivePreview key={JSON.stringify(draft?.objectiveSnapshot)} objective={draft?.objectiveSnapshot} />{draft?.checks?.length > 0 && <section><h3 className="mt-5 text-base font-medium">{copy("Questions for learners")}</h3><ol className="mt-3 list-decimal space-y-3 pl-5 text-sm">{draft.checks.map(check => <li key={check.id}>{check.prompt || copy('Unfinished question')}</li>)}</ol></section>}</DialogContent></Dialog>
 </div>;
}
function MemoryControl({
  ctx,
  locale = 'en'
}) {
  const t = privacyCopy(locale);
  const [confirm, setConfirm] = useState(false),
    [notice, setNotice] = useState(''),
    [failed, setFailed] = useState(false);
  const [, setRetry] = useState(0);
  let observations = [],
    recent = [],
    readError = '';
  try {
    observations = getWeeklyObservations(ctx);
    recent = getRecentContext(ctx);
  } catch (error) {
    readError = error.message;
  }
  return <section className="v-card" lang={locale} aria-labelledby="memory-title"><h2 id="memory-title" className="text-lg font-medium">{t('Your local learning memory')}</h2><p className="v-muted mt-2">{t('This contains structured activity only—not your message text. Clearing it does not delete your projects, conversations, learning evidence, or required audit events.')}</p>{readError ? <><p className="v-notice v-error mt-4" role="alert" lang="en">{readError}</p><button className="v-button mt-3" onClick={() => setRetry(value => value + 1)}>{t('Retry memory')}</button></> : <>{observations.length ? <ul className="mt-4 list-disc pl-5 text-sm" lang="en">{observations.map(o => <li key={o.id}>{o.text}</li>)}</ul> : <p className="v-muted mt-4">{t('No retained observations in this workspace.')}</p>}<details className="mt-4"><summary className="cursor-pointer">{t('Recent retained activity ({count})', {
            count: recent.length
          })}</summary>{recent.map(item => <p className="v-muted mt-2" key={item.id}><span lang="en">{item.app} · {item.action}</span> · <time dateTime={item.at}>{new Date(item.at).toLocaleString(locale)}</time></p>)}</details><button className="v-button mt-5" disabled={!recent.length} onClick={() => setConfirm(true)}>{t('Clear learning memory')}</button></>}{notice && <p className={failed ? 'v-notice v-error mt-3' : 'v-notice mt-3'} role={failed ? 'alert' : 'status'} lang={failed ? 'en' : locale}>{failed ? notice : t(notice)}</p>}<Dialog open={confirm} onOpenChange={setConfirm}><DialogContent lang={locale}><DialogTitle>{t('Clear learning memory?')}</DialogTitle><DialogDescription>{t('Your retained activity observations will be removed from this local workspace. Learning evidence and projects remain. This does not delete backend data because no backend is connected.')}</DialogDescription><button className="v-button" onClick={() => setConfirm(false)}>{t('Keep memory')}</button><button className="v-button" onClick={() => {
          try {
            deleteMemory(ctx);
            setConfirm(false);
            setFailed(false);
            setNotice('Local learning memory cleared. Previously retained observations will not be reconstructed.');
          } catch (error) {
            setFailed(true);
            setNotice(error.message);
          }
        }}>{t('Clear memory')}</button></DialogContent></Dialog></section>;
}
function Trust({
  ctx,
  data,
  area
}) {
  const t = privacyCopy(data.preferences.interfaceLocale || 'en');
  const [notice, setNotice] = useState('');
  const [failure, setFailure] = useState('');
  function perform(action, message) {
    try {
      action();
      setFailure('');
      setNotice(message);
    } catch (cause) {
      setNotice('');
      setFailure(cause.message || 'This change could not be saved. Your saved records are unchanged.');
    }
  }
  function savePreferences(patch, message = 'Preference saved on this device.') {
    perform(() => updatePreferences(ctx, patch), message);
  }
  return <div className="v-page" lang={data.preferences.interfaceLocale || 'en'}><h1 className="v-title">{area === 'privacy' ? t('Privacy & consent') : t('Make Guide work for you')}</h1><p className="v-muted">{t("Your preferences have a purpose and a visible scope. This is a local preview, not verified cloud security.")}</p>{area === 'personalization' ? <>{['student', 'professional'].includes(ctx.role) && <StageProfileEditor key={ctx.workspaceId} ctx={ctx} locale={data.preferences.interfaceLocale || 'en'} />}<section className="v-card"><h2 className="mb-5 text-lg font-medium">{t("Language and accessibility")}</h2><div className="grid gap-5 sm:grid-cols-2">{[['locale', 'Teaching language'], ['interfaceLocale', 'Interface language']].map(([key, label]) => <label className="text-sm" key={key}>{t(label)}<select aria-label={t(label)} className="v-field mt-2" value={data.preferences[key]} onChange={e => savePreferences({
              [key]: e.target.value
            })}><option value="en">{t("English")}</option><option value="hi">{t("\u0939\u093F\u0928\u094D\u0926\u0940")}</option><option value="bn">{t("\u09AC\u09BE\u0982\u09B2\u09BE")}</option></select></label>)}</div><label className="mt-5 block text-sm">{t("Guide appearance")}<select aria-label={t("Guide appearance")} className="v-field mt-2 max-w-xs" value={data.preferences.agiAnimation || 'orb'} onChange={e => savePreferences({
            agiAnimation: e.target.value
          }, 'Guide appearance saved on this device.')}>{["orb", "voice"].includes(data.preferences.agiAnimation || "orb") && <option value={data.preferences.agiAnimation || "orb"}>{t("Previous appearance — shown as Vision Boy")}</option>}<option value="boy">{t("Vision Boy — the sky sphere")}</option><option value="girl">{t("Vision Girl — the glowing bars")}</option></select><p className="v-muted mt-2">{t("Open the Guide control to preview either visual style and see the microphone state. The styles share the same conversations and learning.")}</p></label><p className="v-muted mt-3">{t("Teaching content is translated for curated journeys. Interface translation is being completed; unsupported labels remain in English.")}</p>{[['bilingual', 'Show source-language explanation alongside teaching'], ['lowBandwidth', 'Prefer text alternatives'], ['memory', 'Use my explicit preferences for personalization'], ['voice', 'Audio interaction: speak with Visionary and hear replies. The Guide panel shows listening and speaking states when audio is active. Text remains available when audio is off or unavailable.']].map(([key, label]) => <label className="mt-5 flex items-start gap-3 text-sm" key={key}><input type="checkbox" className="mt-1" checked={Boolean(data.preferences[key])} onChange={e => savePreferences({
            [key]: e.target.checked
          })} />{t(label)}</label>)}</section><section className="v-card"><h2 className="text-lg font-medium">{t("What Guide remembers")}</h2><p className="v-muted mt-3">{t("Source: preferences you selected · Scope: this workspace. No sensitive personality or ability inferences are created.")}</p><button className="v-button mt-5" onClick={() => savePreferences({
          memory: false,
          bilingual: false,
          lowBandwidth: false,
          locale: 'en',
          interfaceLocale: 'en'
        }, 'Personalization preferences reset. Conversations and learning evidence were kept.')}>{t("Reset personalization")}</button></section></> : <><section className="v-card"><h2 className="text-lg font-medium">{t("Sharing boundaries")}</h2><p className="v-muted mt-3">{t("Personal doubts, notes and project drafts stay private. Family billing does not grant guardian access. Organization access is limited to the work explicitly assigned or shared.")}</p><button className="v-button mt-5" onClick={() => perform(() => downloadText('visionary-workspace.json', exportWorkspace(ctx), 'application/json'), 'Workspace export prepared on this device.')}>{t("Export this workspace")}</button><p className="v-muted mt-3">{t("Export contains this account\u2019s local workspace records. Cloud correction, deletion, guardian verification and grievance processing require future services.")}</p></section><section className="v-card"><h2 className="text-lg font-medium">{t("Review sharing permissions")}</h2><p className="v-muted mt-3">{t("Connections keeps requests, approvers, scopes, expiry and revocation together. Review the current permission before accepting a request or sharing work.")}</p><Link className="v-button mt-5" to="/dashboard/connections">{t("Review connections and requests")}</Link><p className="v-muted mt-3">{t("No request is sent and no permission changes when you open this page. Identity and guardian verification remain future services.")}</p></section></>}{failure && <p role="alert" lang="en" className="v-notice v-error">{failure}</p>}{notice && <p role="status" lang={data.preferences.interfaceLocale || 'en'} className="v-notice">{t(notice)}</p>}</div>;
}
