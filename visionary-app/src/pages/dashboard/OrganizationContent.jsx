import {assertOrganizationContentRecord} from '@/services/organizationContentIntegrity';
import { organizationAuthorCopy } from '@/lib/organizationAuthorCopy';
import CurriculumTemplateEditor, { CurriculumTemplatePreview } from '@/components/dashboard/CurriculumTemplateEditor';
import { downloadText } from '@/lib/downloadText';
import { useEffect, useState } from 'react';
import { saveOrganizationContent, changeOrganizationContent, getOrganizationSettings, requireOrganizationPermission } from '@/services/workspaceService';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import OrganizationContentDelivery from '@/components/dashboard/OrganizationContentDelivery';
import { saveResourceEditorDraft, getResourceEditorDraft, clearResourceEditorDraft } from '@/services/resourceEditorDraft';
const labels = {
  'draft-saved': 'Draft saved',
  submit: 'Submitted',
  approve: 'Approved locally',
  'request-changes': 'Changes requested',
  revise: 'New draft opened',
  archive: 'Archived',
  restore: 'Restored as draft'
};
export default function OrganizationContent({
  ctx,
  data,
  kind = "lesson",
  seed
}) {
  const locale = data.preferences.interfaceLocale || 'en';
  const copy = organizationAuthorCopy(locale);
  const newDraftKey = kind === 'lesson' ? 'new:organization-content' : 'new:organization-curriculum';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState(null);
  const [notice, setNotice] = useState('');
  const [failure, setFailure] = useState(false);
  const [note, setNote] = useState('');
  const [checks, setChecks] = useState({
    source: false,
    accuracy: false,
    language: false
  });
  const [recovered, setRecovered] = useState(false),
    [backupBlocked, setBackupBlocked] = useState(false);
  let all=[],integrityError='';try{if(!Array.isArray(data.resources))throw Error('Saved organization resources could not be read. Original records were kept.');all=data.resources.filter(row=>row?.kind===kind);all.forEach(assertOrganizationContentRecord);}catch(error){all=[];integrityError=error.message;}
  const rows = all.filter(row => (filter === 'all' || row.status === filter) && row.title.toLowerCase().includes(query.toLowerCase()));
  const latest = draft?.id ? all.find(row => row.id === draft.id) : null;
  const state = latest?.status || 'draft';
  const editable = ['draft', 'changes'].includes(state) && (!draft?.id || latest?.contentReview);
  const structureChanged = JSON.stringify(draft?.curriculumTemplate) !== JSON.stringify(latest?.curriculumTemplate);
  const unsaved = !!draft && (latest ? draft.title !== latest.title || draft.body !== latest.body || draft.source !== (latest.contentReview?.source || '') || draft.language !== (latest.contentReview?.language || 'en') || structureChanged : !!(draft.title || draft.body || draft.source || draft.curriculumTemplate));
  useEffect(() => {
    if (backupBlocked || !draft || !unsaved && !note && !Object.values(checks).some(Boolean)) return;
    try {
      saveResourceEditorDraft(ctx, draft.id || newDraftKey, {
        ...draft,
        _reviewNote: note,
        _reviewChecks: checks
      });
    } catch (error) {
      setNotice(error.message);
      setFailure(true);
    }
  }, [draft, unsaved, note, checks, ctx.personId, ctx.workspaceId, backupBlocked]);
  useEffect(() => {
    if (seed && !integrityError) open(null, true, seed);
  }, [seed?.nonce]);
  function open(row, restore = true, prefill) {
    let defaultLanguage = 'en';
    if (!row) {
      try {
        defaultLanguage = getOrganizationSettings(ctx).contentLanguage;
      } catch (error) {
        setNotice(error.message);
        setFailure(true);
        return;
      }
    }
    const initial = row ? {
      id: row.id,
      title: row.title,
      body: row.body,
      source: row.contentReview?.source || '',
      language: row.contentReview?.language || 'en',
      revision: row.contentReview?.revision,
      ...(row.curriculumTemplate ? {
        curriculumTemplate: structuredClone(row.curriculumTemplate)
      } : {})
    } : {
      title: prefill?.title || '',
      body: prefill?.body || '',
      source: '',
      language: defaultLanguage,
      kind
    };
    setRecovered(false);
    setBackupBlocked(false);
    setNote('');
    setChecks({
      source: false,
      accuracy: false,
      language: false
    });
    setNotice('');
    setFailure(false);
    try {
      const backup = restore ? getResourceEditorDraft(ctx, row?.id || newDraftKey) : null;
      setDraft(backup ? {
        ...initial,
        ...backup.draft,
        source: typeof backup.draft.source === 'string' ? backup.draft.source : initial.source,
        language: ['en', 'hi', 'bn'].includes(backup.draft.language) ? backup.draft.language : initial.language
      } : initial);
      setRecovered(!!backup);
      if (backup) {
        setNote(typeof backup.draft._reviewNote === 'string' ? backup.draft._reviewNote : '');
        setChecks(Object.fromEntries(['source', 'accuracy', 'language'].map(key => [key, backup.draft._reviewChecks?.[key] === true])));
      }
    } catch (error) {
      setDraft(initial);
      setBackupBlocked(true);
      setNotice(error.message);
      setFailure(true);
    }
  }
  function perform(action, message) {
    try {
      const key = draft?.id || newDraftKey;
      const saved = action();
      let cleanupFailed = false;
      if (saved) {
        try {
          if (backupBlocked) cleanupFailed = true;else clearResourceEditorDraft(ctx, key);
        } catch {
          cleanupFailed = true;
        }
        open(saved, false);
      }
      setNotice(copy(message) + (cleanupFailed ? copy(' The old editor backup could not be removed; it may appear again.') : ''));
      setFailure(false);
    } catch (error) {
      setNotice(error.message);
      setFailure(true);
    }
  }
  function discard(loadLatest = false) {
    try {
      const row = draft?.id ? all.find(item => item.id === draft.id) : null;
      clearResourceEditorDraft(ctx, draft?.id || newDraftKey);
      if (loadLatest && row) open(row, false);else {
        setDraft(null);
        setRecovered(false);
      }
    } catch (error) {
      setNotice(error.message);
      setFailure(true);
    }
  }
  function exportEdits() {
    try {
      requireOrganizationPermission(ctx, 'academic');
      downloadText(kind + '-content-edits.json', JSON.stringify({
        kind,
        title: draft.title,
        body: draft.body,
        source: draft.source,
        language: draft.language,
        curriculumTemplate: draft.curriculumTemplate,
        reviewNote: note,
        checks
      }, null, 2), 'application/json');
      setNotice('Current edits exported; this does not save, approve or share content.');
      setFailure(false);
    } catch (error) {
      setNotice(error.message);
      setFailure(true);
    }
  }
  function transition(action) {
    perform(() => changeOrganizationContent(ctx, draft.id, draft.revision, action, note, checks), copy('{action}. Saved on this device.', {
      action: copy(labels[action])
    }));
  }
  if(integrityError)return <div lang={locale} className="v-page"><h1 className="v-title">{copy('Saved organization content unavailable')}</h1><p role="alert" className="v-notice v-error" lang="en">{integrityError}</p><p className="v-muted mt-3">{copy('Original source records and your editor backup remain on this device. No review or delivery was recorded.')}</p><button type="button" className="v-button mt-4" onClick={()=>window.dispatchEvent(new Event('visionary:workspace-change'))}>{copy('Retry saved content')}</button></div>;
  return <div lang={locale} className="v-page"><header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="v-title">{kind === 'curriculum' ? copy("Reviewed curriculum templates") : copy("Organization content")}</h1><p className="v-muted mt-2">{copy("Author, review and retain source versions before use.")}</p></div><button className="v-button primary" onClick={() => open(null)}>{kind === 'curriculum' ? copy("New curriculum template") : copy("New content draft")}</button></header><p className="v-notice">{kind === 'curriculum' ? copy("Map the intended learner group, source sections, objectives and prerequisite sequence in each template. Approved fixed copies reach only chosen accepted teachers; teachers review their own preparation and classroom assignment. ") : ''}{copy("Approval records an editorial review on this device. It does not publish a learner curriculum, generate learning activities or verify source rights. Teachers control classroom assignments.")}</p><div className="flex flex-wrap gap-4"><label className="min-w-0 flex-1 text-sm">{copy("Search content")}<input className="v-field mt-2" value={query} onChange={event => setQuery(event.target.value)} /></label><label className="text-sm">{copy("Content state")}<select aria-label={copy("Content state")} className="v-field mt-2" value={filter} onChange={event => setFilter(event.target.value)}>{['all', 'draft', 'submitted', 'changes', 'approved', 'archived'].map(value => <option key={value} value={value}>{copy(value)}</option>)}</select></label></div><section className="v-card"><h2 className="text-lg font-medium">{copy("Content versions")}</h2>{rows.length ? rows.map(row => <button key={row.id} className="v-list-row w-full text-left" onClick={() => open(row)}><div><h3 className="text-sm font-medium">{row.title}</h3><p className="v-muted">{row.contentReview ? copy('Revision {revision} · {state}', {
              revision: row.contentReview.revision,
              state: copy(row.status)
            }) : copy("Earlier resource \xB7 review history unavailable")}</p></div><span className="text-sm">{copy("Open")}</span></button>) : <div className="py-6"><p className="text-sm">{query || filter !== 'all' ? copy("No matching content.") : copy("Start with one sourced content draft.")}</p>{(query || filter !== 'all') && <button className="v-button mt-3" onClick={() => {
          setQuery('');
          setFilter('all');
        }}>{copy("Clear filters")}</button>}</div>}</section>
 {!draft && notice && <p className={`v-notice ${failure ? 'v-error' : ''}`} lang={copy(notice) === notice ? 'en' : locale} role={failure ? 'alert' : 'status'}>{copy(notice)}</p>}<Dialog open={!!draft} onOpenChange={value => {
      if (!value) {
        if (unsaved) {
          setNotice('Save your draft or choose Discard unsaved edits before closing.');
          setFailure(true);
        } else setDraft(null);
      }
    }}><DialogContent lang={locale} className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogTitle>{draft?.id ? copy("Review content version") : copy("Create content draft")}</DialogTitle><DialogDescription>{copy("Edits stay here if saving fails. A different academic administrator reviews each authored revision.")}</DialogDescription>{draft && <>{recovered && <section className="v-notice" role="status"><p>{copy("Unsaved organization content and review edits recovered from this device. Review the saved version before taking an approval action.")}</p>{draft.id && <button className="v-button mt-3" onClick={() => discard(true)}>{copy("Discard recovered edits and load latest")}</button>}</section>}<p className="v-muted">{latest?.contentReview ? copy('Revision {revision} · {state}', {
              revision: latest.contentReview.revision,
              state: copy(state)
            }) : copy("Local draft")} · {copy('Organization audience')}</p>{draft.id && !latest?.contentReview && <p className="v-notice">{copy("This earlier resource has no recorded source or review history. Create a new sourced draft to enter this workflow; the earlier resource is retained.")}</p>}<label className="text-sm">{copy("Content title")}<input className="v-field mt-2" maxLength={200} disabled={!editable} value={draft.title} onChange={event => setDraft({
              ...draft,
              title: event.target.value
            })} /></label><label className="text-sm">{copy("Content and learning objective")}<textarea aria-label={copy("Content and learning objective")} className="v-field mt-2" rows={8} maxLength={50000} disabled={!editable} value={draft.body} onChange={event => setDraft({
              ...draft,
              body: event.target.value
            })} /></label><label className="text-sm">{copy("Source and exact version")}<textarea aria-label={copy("Source and exact version")} className="v-field mt-2" rows={2} maxLength={2000} disabled={!editable} value={draft.source} onChange={event => setDraft({
              ...draft,
              source: event.target.value
            })} /></label><label className="text-sm">{copy("Source language")}<select aria-label={copy("Source language")} className="v-field mt-2" disabled={!editable} value={draft.language} onChange={event => setDraft({
              ...draft,
              language: event.target.value
            })}><option value="en">English</option><option value="hi">हिन्दी</option><option value="bn">বাংলা</option></select></label>
 {kind === 'curriculum' && <CurriculumTemplateEditor value={draft.curriculumTemplate} onChange={curriculumTemplate => setDraft({
            ...draft,
            curriculumTemplate
          })} disabled={!editable} locale={draft.language} />}
 <button className="v-button" onClick={exportEdits}>{copy("Export current content edits")}</button>{editable && <button className="v-button primary" onClick={() => perform(() => saveOrganizationContent(ctx, {
            ...draft,
            kind
          }, draft.revision), 'Draft saved. Submit the saved revision when it is ready.')}>{copy("Save content draft")}</button>}
 {latest?.contentReview && <><section className="v-card"><h2 className="text-base font-medium">{copy("Review saved revision")}</h2><p className="v-muted mt-2">{copy("Actions apply to the saved revision. Save edits before submission. Review notes do not become learner evidence.")}</p><label className="mt-4 block text-sm">{copy("Review note")}<textarea aria-label={copy("Review note")} className="v-field mt-2" rows={3} maxLength={2000} value={note} onChange={event => setNote(event.target.value)} /></label>{state === 'submitted' && <div className="mt-3 space-y-3">{[['source', 'Source and version checked'], ['accuracy', 'Accuracy and objective checked'], ['language', 'Language and accessibility checked']].map(([key, label]) => <label className="flex items-start gap-3 text-sm" key={key}><input type="checkbox" checked={checks[key]} onChange={event => setChecks({
                    ...checks,
                    [key]: event.target.checked
                  })} />{copy(label)}</label>)}</div>}<div className="mt-4 flex flex-wrap gap-3">{['draft', 'changes'].includes(state) && <button className="v-button" disabled={unsaved} onClick={() => transition('submit')}>{copy("Submit saved revision")}</button>}{state === 'submitted' && latest.contentReview.author !== ctx.personId && <><button className="v-button primary" disabled={unsaved} onClick={() => transition('approve')}>{copy("Approve saved revision")}</button><button className="v-button" disabled={unsaved} onClick={() => transition('request-changes')}>{copy("Request changes")}</button></>}{state === 'submitted' && latest.contentReview.author === ctx.personId && <p className="v-muted">{copy("Waiting for a different academic administrator to review.")}</p>}{state === 'approved' && <button className="v-button" disabled={unsaved} onClick={() => transition('revise')}>{copy("Open new draft revision")}</button>}{['draft', 'changes', 'approved'].includes(state) && <button className="v-button" disabled={unsaved} onClick={() => transition('archive')}>{copy("Archive saved content")}</button>}{state === 'archived' && <button className="v-button" disabled={unsaved} onClick={() => transition('restore')}>{copy("Restore as draft")}</button>}</div></section>{state === 'approved' && <OrganizationContentDelivery key={`${latest.id}:${latest.contentReview.revision}`} ctx={ctx} resource={latest} />}<details><summary className="cursor-pointer text-sm font-medium">{copy("Review history and earlier versions")}</summary>{latest.contentReview.history.map((event, index) => <article className="mt-3 border-t pt-3 text-sm" key={index}><p>{copy(labels[event.action] || event.action)} · {copy('Revision {revision}', {
                    revision: event.revision
                  })}</p><p className="v-muted break-all mt-1">{event.actor} · {Number.isFinite(new Date(event.at).getTime()) ? new Date(event.at).toLocaleString(locale) : copy('Unavailable')}</p>{event.note && <p className="mt-2 whitespace-pre-wrap">{event.note}</p>}</article>)}{latest.contentReview.versions.map(version => <details className="mt-4 text-sm" key={version.revision}><summary className="cursor-pointer">{copy('Revision {revision}: {title}', {
                    revision: version.revision,
                    title: version.title
                  })}</summary><p className="v-muted mt-2">{version.source} · {version.language}</p><p className="mt-2 whitespace-pre-wrap">{version.body}</p>{version.curriculumTemplate && <CurriculumTemplatePreview value={version.curriculumTemplate} locale={version.language} />}</details>)}</details></>}
 {draft.id && latest && <button className="v-button" onClick={() => discard(true)}>{copy('Discard edits and load latest saved version')}</button>}{unsaved && <button className="v-button" onClick={() => discard()}>{copy("Discard unsaved edits and close")}</button>}{notice && <p className={`v-notice ${failure ? 'v-error' : ''}`} role={failure ? 'alert' : 'status'}>{notice}</p>}</>}</DialogContent></Dialog></div>;
}
