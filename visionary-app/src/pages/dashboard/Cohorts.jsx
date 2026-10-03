import { cohortCopy } from '@/lib/cohortCopy';
import { downloadText } from '@/lib/downloadText';
import { getResourceEditorDraft, saveResourceEditorDraft, clearResourceEditorDraft } from '@/services/resourceEditorDraft';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { organizationRoster, saveCohort } from '@/services/classroomService';
import { archiveResource, resourceRevision } from '@/services/workspaceService';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
export default function Cohorts() {
  const scope = useWorkspace();
  return <CohortWorkspace key={scope.ctx?.personId + ':' + scope.ctx?.workspaceId} scope={scope} />;
}
function CohortWorkspace({
  scope
}) {
  const {
    ctx,
    data,
    revision,
    error: workspaceError,
    refresh
  } = scope;
  const locale = data?.preferences.interfaceLocale || 'en';
  const t = cohortCopy(locale);
  const [base, setBase] = useState(undefined);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState(null);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const {
    data: roster,
    isPending,
    error,
    refetch
  } = useQuery({
    queryKey: ['workspace', 'organization-roster', ctx?.personId, ctx?.workspaceId, revision],
    enabled: !!ctx,
    queryFn: () => organizationRoster(ctx),
    retry: false
  });
  useEffect(() => {
    if (!draft || !ctx || blocked) return;
    const saved = data?.resources.find(row => row.id === draft.id);
    if (saved && resourceRevision(saved) === resourceRevision(draft) && base === resourceRevision(saved)) return;
    try {
      saveResourceEditorDraft(ctx, draft.id || 'new:cohort', draft, base);
    } catch (error) {
      setNotice(error.message);
      setFailed(true);
    }
  }, [draft, base, ctx?.personId, ctx?.workspaceId, blocked]);
  function open(resource) {
    setNotice('');
    setFailed(false);
    setBlocked(false);
    const key = resource.id || 'new:cohort';
    try {
      const backup = getResourceEditorDraft(ctx, key);
      if (backup) {
        const value = backup.draft;
        if (value.kind !== 'cohort' || value.id !== resource.id || !Array.isArray(value.members) || !Array.isArray(value.classIds) || value.members.some(item => typeof item !== 'string') || value.classIds.some(item => typeof item !== 'string') || resource.id && typeof backup.baseRevision !== 'string') throw Error('Cohort recovery is incomplete. The original backup is retained.');
        setDraft(value);
        setBase(backup.baseRevision);
        setNotice('Unsaved cohort edits recovered. Review the current roster before saving.');
      } else {
        setDraft(resource);
        setBase(resource.id ? resourceRevision(resource) : undefined);
      }
    } catch (error) {
      setDraft(resource);
      setBase(resource.id ? resourceRevision(resource) : undefined);
      setBlocked(true);
      setNotice(error.message);
      setFailed(true);
    }
  }
  function exportEdits() {
    try {
      downloadText('cohort-edits.json', JSON.stringify(draft, null, 2), 'application/json');
      setNotice('Current cohort edits exported. This does not save or share them.');
      setFailed(false);
    } catch (error) {
      setNotice(error.message);
      setFailed(true);
    }
  }
  function reload() {
    try {
      const latest = draft.id ? data.resources.find(row => row.id === draft.id) : {
        title: '',
        body: '',
        kind: 'cohort',
        members: [],
        classIds: [],
        status: 'draft'
      };
      if (!latest) throw Error('This cohort is unavailable. Your current edits remain exportable.');
      clearResourceEditorDraft(ctx, draft.id || 'new:cohort');
      setDraft({
        ...latest,
        members: latest.members || [],
        classIds: latest.classIds || []
      });
      setBase(latest.id ? resourceRevision(latest) : undefined);
      setBlocked(false);
      setFailed(false);
      setNotice('Latest cohort loaded; this tab’s edits discarded.');
    } catch (error) {
      setNotice(error.message);
      setFailed(true);
    }
  }
  const savedDraft = data?.resources.find(row => row.id === draft?.id);
  const conflict = !!draft?.id && (!savedDraft || resourceRevision(savedDraft) !== base);
  if (workspaceError) return <div className="v-page" lang={locale}><p role="alert" lang="en">{workspaceError}</p><button className="v-button" onClick={refresh}>{t('Retry')}</button>{draft && <button className="v-button" onClick={exportEdits}>{t('Export cohort edits')}</button>}</div>;
  if (!data) return <div className="v-page" role="status">{t("Opening organization\u2026")}</div>;
  const rows = data.resources.filter(r => r.kind === 'cohort' && r.title.toLowerCase().includes(query.toLowerCase()));
  const staleMembers = roster && !error ? (draft?.members || []).filter(email => !roster.members.some(member => member.email === email)) : [];
  const staleClasses = roster && !error ? (draft?.classIds || []).filter(id => !roster.classes.some(classroom => classroom.id === id)) : [];
  function toggle(key, value) {
    setDraft(d => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter(v => v !== value) : [...d[key], value]
    }));
  }
  async function save() {
    setBusy(true);
    try {
      const key = draft.id || 'new:cohort';
      const saved = await saveCohort(ctx, draft, base);
      setDraft(saved);
      setBase(resourceRevision(saved));
      setNotice('Cohort saved. Membership does not grant access to personal learning.');
      setFailed(false);
      try {
        if (!blocked) clearResourceEditorDraft(ctx, key);
        setDraft(null);
      } catch (error) {
        setNotice('The cohort was saved, but its editor backup remains: ' + error.message);
        setFailed(true);
      }
    } catch (error) {
      setNotice(error.message);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return <div className="v-page" lang={locale}><header className="flex flex-wrap justify-between gap-4"><div><h1 className="v-title">{t("Cohorts")}</h1><p className="v-muted mt-2">{t("Give a connected group a shared purpose, without merging their personal work.")}</p></div><button className="v-button primary" onClick={() => {
        open({
          title: '',
          body: '',
          kind: 'cohort',
          members: [],
          classIds: [],
          status: 'draft'
        });
      }}><Plus size={18} />{t("Create cohort")}</button></header>
 {isPending ? <p role="status">{t("Loading accepted members and linked classes\u2026")}</p> : error ? <p role="alert" className="v-notice v-error"><span lang="en">{error.message}</span><button className="v-button ml-3" onClick={() => refetch()}>{t("Retry")}</button></p> : <p className="v-notice">{t('{members} accepted members · {classes} explicitly linked classes.', {
        members: roster.members.length,
        classes: roster.classes.length
      })} <Link className="underline" to="/dashboard/people">{t("Manage people")}</Link><button className="ml-3 underline" onClick={() => refetch()}>{t("Refresh roster")}</button></p>}
 <label><span className="sr-only">{t("Search cohorts")}</span><input className="v-field max-w-md" value={query} onChange={e => setQuery(e.target.value)} placeholder={t("Search cohorts")} /></label>
 <section className="v-card">{rows.length ? rows.map(r => <div className="v-list-row" key={r.id}><button className="min-w-0 flex-1 text-left" onClick={() => {
          open({
            ...r,
            members: r.members || [],
            classIds: r.classIds || []
          });
        }}><h2 className="text-base font-medium break-words">{r.title}</h2><p className="v-muted">{error||isPending?<>{t(r.status)} · {t('Roster unavailable')}</>:t('{status} · {members} connected members · {classes} linked classes', {
              status: t(r.status),
              members: (r.members || []).filter(email => roster?.members.some(m => m.email === email)).length,
              classes: (r.classIds || []).filter(id => roster?.classes.some(c => c.id === id)).length
            })}</p></button><button className="v-button" onClick={() => {
          try {
            archiveResource(ctx, r.id);
          } catch (e) {
            setNotice(e.message);
            setFailed(true);
          }
        }}>{t(r.status === 'archived' ? 'Restore' : 'Archive')}</button></div>) : <div className="py-8"><Users className="mb-4 text-[#4285F4]" /><h2 className="text-lg font-medium">{t(query ? 'No matching cohorts' : 'Start with one learning group')}</h2><p className="v-muted mt-3">{t("Connect people, choose a clear purpose, and link the classes that support it.")}</p></div>}</section>{notice && <p role={failed ? 'alert' : 'status'} lang={failed ? 'en' : locale} className={`v-notice ${failed ? 'v-error' : ''}`}>{failed ? notice : t(notice)}</p>}
 <Dialog open={!!draft} onOpenChange={open => {
      if (!open && !busy) setDraft(null);
    }}><DialogContent lang={locale} className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl"><DialogTitle>{t(draft?.id ? 'Edit cohort' : 'Create cohort')}</DialogTitle><DialogDescription>{t("Only accepted members and explicitly organization-linked classes are available. No private notes or conversations are included.")}</DialogDescription>{draft && <>{error&&<div className="v-notice v-error" role="alert"><p lang="en">{error.message}</p><button className="v-button mt-3" onClick={()=>refetch()}>{t("Refresh roster")}</button></div>}{isPending&&<p role="status">{t("Loading accepted members and linked classes…")}</p>}<label className="text-sm">{t("Name")}<input className="v-field mt-2" value={draft.title} onChange={e => setDraft({
              ...draft,
              title: e.target.value
            })} /></label><label className="text-sm">{t("Purpose and curriculum objectives")}<textarea aria-label={t('Purpose and curriculum objectives')} className="v-field mt-2" rows={3} value={draft.body} onChange={e => setDraft({
              ...draft,
              body: e.target.value
            })} /></label><fieldset><legend className="mb-3 text-sm font-medium">{t("Connected people")}</legend>{error||isPending?null:roster?.members.length ? roster.members.map(m => <label key={m.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={draft.members.includes(m.email)} onChange={() => toggle('members', m.email)} /><span className="break-all">{m.email} · {t(m.role)}</span></label>) : <p className="v-muted">{t("Invite people and wait for acceptance in People.")}</p>}{staleMembers.map(email => <label key={email} className="flex min-h-11 items-center gap-3 text-sm text-[#b3261e]"><input type="checkbox" checked onChange={() => toggle('members', email)} /><span className="break-all">{email} · {t('no longer connected — remove to save')}</span></label>)}</fieldset><fieldset><legend className="mb-3 text-sm font-medium">{t("Linked classes")}</legend>{error||isPending?null:roster?.classes.length ? roster.classes.map(c => <label key={c.id} className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={draft.classIds.includes(c.id)} onChange={() => toggle('classIds', c.id)} />{c.name}</label>) : <p className="v-muted">{t("An accepted teacher can link a class when creating it.")}</p>}{staleClasses.map(id => <label key={id} className="flex min-h-11 items-center gap-3 text-sm text-[#b3261e]"><input type="checkbox" checked onChange={() => toggle('classIds', id)} /><span className="break-all">{t("Previously linked class \xB7 no longer available \u2014 remove to save")}</span></label>)}</fieldset>{notice && <p role={failed ? 'alert' : 'status'} lang={failed ? 'en' : locale} className={`v-notice ${failed ? 'v-error' : ''}`}>{failed ? notice : t(notice)}</p>}{conflict && <p role="alert" className="v-notice">{t('This cohort changed in another tab. Your edits remain available to export.')}</p>}<div className="flex flex-wrap gap-3"><button className="v-button" onClick={exportEdits}>{t('Export cohort edits')}</button><button className="v-button" disabled={busy} onClick={reload}>{t('Load latest cohort and discard edits')}</button></div><button className="v-button primary" disabled={busy || conflict || isPending || !!error || !draft.title.trim()} onClick={save}>{t(busy ? 'Saving…' : 'Save cohort')}</button></>}</DialogContent></Dialog></div>;
}
