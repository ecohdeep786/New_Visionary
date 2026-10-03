import { organizationCopy } from '@/lib/organizationCopy';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getOrganizationSettings, saveOrganizationSettings, organizationAccess } from '@/services/workspaceService';
import { getResourceEditorDraft, saveResourceEditorDraft, clearResourceEditorDraft } from '@/services/resourceEditorDraft';
import { downloadText } from '@/lib/downloadText';
const key = 'new:organization-settings';
const kinds = {
  school: 'School',
  coaching: 'Coaching organization',
  company: 'Company',
  ngo: 'Nonprofit organization'
};
const languages = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা'
};
export default function OrganizationSettings({
  scope
}) {
  const {
    ctx,
    revision
  } = scope;
  const locale = scope.data?.preferences.interfaceLocale || 'en';
  const t = (key, params) => organizationCopy(locale, key, params);
  const [draft, setDraft] = useState(null),
    [base, setBase] = useState(0),
    [notice, setNotice] = useState(''),
    [error, setError] = useState(''),
    [blocked, setBlocked] = useState(false),
    [review, setReview] = useState(false);
  const view = useMemo(() => {
    try {
      return {
        value: getOrganizationSettings(ctx),
        editable: organizationAccess(ctx).permissions.includes('permissions'),
        audit: organizationAccess(ctx).permissions.includes('audit')
      };
    } catch (failure) {
      return {
        error: failure.message
      };
    }
  }, [ctx.personId, ctx.workspaceId, revision]);
  useEffect(() => {
    if (draft || !view.value) return;
    let restored = null;
    try {
      restored = getResourceEditorDraft(ctx, key);
      if (restored && (!Object.hasOwn(kinds, restored.draft.kind) || !Object.hasOwn(languages, restored.draft.contentLanguage) || typeof restored.draft.teacherDeliveryEnabled !== 'boolean' || !/^\d+$/.test(restored.baseRevision || ''))) throw Error('Organization settings recovery is incomplete. The original backup is retained.');
    } catch (failure) {
      restored = null;
      setError(failure.message);
      setBlocked(true);
    }
    setDraft(restored?.draft || view.value);
    setBase(restored ? Number(restored.baseRevision) : view.value.revision);
    if (restored) setNotice('Unsaved organization settings recovered. Review their effects before saving.');
  }, [view.value, draft]);
  function edit(patch) {
    const next = {
      ...draft,
      ...patch
    };
    setDraft(next);
    setNotice('');
    setReview(false);
    if (blocked) return;
    try {
      saveResourceEditorDraft(ctx, key, {
        ...next,
        title: 'Organization settings',
        body: ''
      }, String(base));
      setError('');
    } catch (failure) {
      setError(failure.message);
    }
  }
  function reload() {
    try {
      const latest = getOrganizationSettings(ctx);
      clearResourceEditorDraft(ctx, key);
      setDraft(latest);
      setBase(latest.revision);
      setError('');
      setBlocked(false);
      setReview(false);
      setNotice('Latest organization settings loaded; this tab’s edits discarded.');
    } catch (failure) {
      setError(failure.message);
    }
  }
  function save() {
    try {
      const saved = saveOrganizationSettings(ctx, draft, base);
      setDraft(saved);
      setBase(saved.revision);
      setReview(false);
      setNotice('Organization settings saved on this device.');
      if (!blocked) {
        try {
          clearResourceEditorDraft(ctx, key);
          setError('');
        } catch (failure) {
          setError('Settings were saved, but the editor backup remains: ' + failure.message);
        }
      }
    } catch (failure) {
      setReview(false);
      setError(failure.message);
    }
  }
  function exportEdits() {
    try {
      downloadText('organization-settings-edits.json', JSON.stringify({
        kind: draft.kind,
        contentLanguage: draft.contentLanguage,
        teacherDeliveryEnabled: draft.teacherDeliveryEnabled
      }, null, 2), 'application/json');
      setNotice('Current settings edits exported. This does not apply them.');
    } catch (failure) {
      setError(failure.message);
    }
  }
  if (view.error || scope.error) return <div className="v-page" lang={locale}><h1 className="v-title">{t("Organization settings")}</h1><p className="v-notice v-error" role="alert"><span lang="en">{scope.error || view.error}</span></p><button className="v-button" onClick={scope.refresh}>{t('Retry')}</button>{draft && <button className="v-button" onClick={exportEdits}>{t('Export settings edits')}</button>}<Link className="v-button" to="/dashboard/home">{t("Return to your workspace")}</Link></div>;
  if (!draft) return <div className="v-page" role="status">{t("Reading organization settings\u2026")}</div>;
  const conflict = base !== view.value.revision;
  const dirty = draft.kind !== view.value.kind || draft.contentLanguage !== view.value.contentLanguage || draft.teacherDeliveryEnabled !== view.value.teacherDeliveryEnabled;
  return <div className="v-page" lang={locale}><header><h1 className="v-title">{t("Organization settings")}</h1><p className="v-muted mt-2">{t(kinds[view.value.kind])} · {t('Revision {revision} · This device only', {
          revision: view.value.revision
        })}</p></header>
 {!view.editable && <p className="v-notice">{t("Your administrative role can read these settings. Only the organization owner can change them.")}</p>}
 {conflict && <section className="v-notice"><h2 className="font-medium">{t("Newer organization settings are saved")}</h2><p className="v-muted mt-2">{t("Your fields remain here. Export them or load the latest settings before applying changes.")}</p><p className="v-muted mt-2">{t('Saved: {kind} · {language} · New deliveries {state}', {
          kind: t(kinds[view.value.kind]),
          language: languages[view.value.contentLanguage],
          state: t(view.value.teacherDeliveryEnabled ? 'Enabled' : 'Paused')
        })}</p></section>}
 <section className="v-card grid gap-5"><h2 className="text-lg font-medium">{t("Content and distribution")}</h2><label className="text-sm">{t("Organization type")}<select className="v-field mt-2" value={draft.kind} disabled={!view.editable} onChange={event => edit({
          kind: event.target.value
        })}>{Object.entries(kinds).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label><label className="text-sm">{t("Default language for new content")}<select className="v-field mt-2" value={draft.contentLanguage} disabled={!view.editable} onChange={event => edit({
          contentLanguage: event.target.value
        })}>{Object.entries(languages).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><p className="v-muted">{t("Sets the initial source language for a new draft. It does not translate or change existing content, reviews or learner preferences.")}</p><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={draft.teacherDeliveryEnabled} disabled={!view.editable} onChange={event => edit({
          teacherDeliveryEnabled: event.target.checked
        })} />{t("Allow new approved content deliveries to teachers")}</label><p className="v-muted">{t("Pausing blocks new delivery actions by all academic administrators. Existing fixed deliveries, teacher drafts and assignments remain available under their membership permissions.")}</p></section>
 <section className="v-card"><h2 className="text-lg font-medium">{t("Current safeguards")}</h2><ul className="mt-3 space-y-3 text-sm"><li>{t("Source and version are required; a different author reviews content before approval.")}</li><li>{t("Minor and guardian access follows existing consent scopes. Organization settings cannot grant access to private questions or personal projects.")}</li><li>{t("Live model controls, domain verification, scheduled retention and server enforcement are not connected.")}</li></ul><Link className="v-button mt-4" to="/dashboard/people">{t("Review administrative permissions")}</Link></section>
 {error && <p className="v-notice v-error" role="alert"><span lang="en">{error}</span> {t('Current fields remain available to export.')}</p>}{notice && <p className="v-notice" role="status">{t(notice)}</p>}
 <div className="flex flex-wrap gap-3">{view.editable && <button className="v-button primary" disabled={!dirty || conflict} onClick={() => setReview(true)}>{t("Review settings changes")}</button>}<button className="v-button" onClick={exportEdits}>{t("Export settings edits")}</button><button className="v-button" onClick={reload}>{t("Load latest settings and discard edits")}</button>{view.audit && <Link className="v-button" to="/dashboard/audit">{t("Review audit")}</Link>}</div>
 <Dialog open={review} onOpenChange={setReview}><DialogContent lang={locale}><DialogTitle>{t("Apply organization settings?")}</DialogTitle><DialogDescription>{t("Review the saved values and the effects of your changes. These settings apply only in this local preview.")}</DialogDescription><dl className="grid gap-3 text-sm"><div><dt>{t("Organization type")}</dt><dd>{t(kinds[view.value.kind])} → {t(kinds[draft.kind])}</dd></div><div><dt>{t("New content language")}</dt><dd>{languages[view.value.contentLanguage]} → {languages[draft.contentLanguage]}</dd></div><div><dt>{t("New teacher deliveries")}</dt><dd>{t(view.value.teacherDeliveryEnabled ? 'Enabled' : 'Paused')} → {t(draft.teacherDeliveryEnabled ? 'Enabled' : 'Paused')}</dd></div></dl><p className="v-muted">{t("Existing delivered copies and assignments are retained. No account age, guardian permission, model, billing or data retention changes are made.")}</p><button className="v-button primary" disabled={conflict || !view.editable} onClick={save}>{t("Confirm settings changes")}</button></DialogContent></Dialog>
 </div>;
}
