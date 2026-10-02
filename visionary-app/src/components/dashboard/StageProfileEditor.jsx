import { stageCopy } from '@/lib/stageCopy';
import { readStageEditorDraft, saveStageEditorDraft, clearStageEditorDraft, stageEditorRevision, readStageEditorBackup } from '@/services/stageEditorDraft';
import { downloadText } from '@/lib/downloadText';
import { useState } from 'react';
import { getStageProfile, proposeStageTransition, getStageSuggestions, respondStageSuggestion } from '@/services/stageTransitionService';
import { Link } from 'react-router-dom';
export default function StageProfileEditor({
  ctx,
  locale = 'en'
}) {
  const t = stageCopy(locale);
  const [draft, setDraft] = useState(null),
    [base, setBase] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [suggestions, setSuggestions] = useState([]),
    [draftRevision, setDraftRevision] = useState('null');
  function load(discard = false) {
    try {
      const current = getStageProfile(ctx);
      const saved = readStageEditorDraft(ctx);
      if (discard && saved) clearStageEditorDraft(ctx, stageEditorRevision(saved));
      setDraft(!discard && saved ? saved.fields : {
        ...current,
        subjectsText: (current.subjects || []).join(', ')
      });
      setBase(!discard && saved ? saved.base : JSON.stringify(current));
      setDraftRevision(!discard ? stageEditorRevision(saved) : 'null');
      setSuggestions(getStageSuggestions(ctx));
      setError('');
      setNotice(!discard && saved ? 'Unfinished stage edits recovered. Saving checks the original profile revision.' : 'Current stage loaded.');
    } catch (failure) {
      setError(failure.message);
    }
  }
  function save(event) {
    event.preventDefault();
    try {
      const next = {
        board: draft.board || undefined,
        classLevel: draft.classLevel || undefined,
        stage: draft.stage || undefined,
        exam: draft.exam || undefined,
        institution: draft.institution || undefined,
        subjects: draft.subjectsText.split(',').map(value => value.trim()).filter(Boolean)
      };
      const result = proposeStageTransition(ctx, next, 'You updated your learning profile', {
        expectedProfile: base
      });
      setNotice(result.state === 'awaiting-confirm' ? 'A boundary change needs confirmation on Home. Your current stage is unchanged.' : 'Stage updated. Your saved work is retained; Undo and Postpone are available on Home.');
      try {
        clearStageEditorDraft(ctx, draftRevision);
        setError('');
      } catch (failure) {
        setError(failure.message);
      }
      setDraft(null);
    } catch (failure) {
      setError(failure.message);
    }
  }
  function edit(key, value) {
    const next = {
      ...draft,
      [key]: value
    };
    setDraft(next);
    try {
      const saved = saveStageEditorDraft(ctx, next, base, draftRevision);
      setDraftRevision(stageEditorRevision(saved));
      setError('');
    } catch (failure) {
      setError(failure.message);
    }
  }
  function respond(id, accept) {
    try {
      respondStageSuggestion(ctx, id, accept);
      setSuggestions(getStageSuggestions(ctx));
      setNotice(accept ? 'Suggestion reviewed. Check Home for the applied change or required confirmation.' : 'Suggestion dismissed. Your stage is unchanged.');
      setError('');
    } catch (failure) {
      setError(failure.message);
    }
  }
  return <section className="v-card" lang={locale}><h2 className="text-lg font-medium">{t("Your learning stage")}</h2><p className="v-muted mt-2">{t("Update your personal learning profile. Board, institution and education-stage changes require confirmation. This does not change your age, consent or safety permissions.")}</p>{notice && <p role="status" className="v-notice mt-3">{t(notice)}</p>}{error && <p role="alert" className="v-notice v-error mt-3"><span lang="en">{error}</span> {t("Your current edits remain here.")}<button className="v-button mt-3" onClick={() => {
        try {
          downloadText('visionary-stage-editor-backup.txt', readStageEditorBackup(ctx));
        } catch (failure) {
          setError(failure.message);
        }
      }}>{t("Export saved stage edits backup")}</button>{draft && <button className="v-button mt-3" onClick={() => downloadText('visionary-stage-edits.json', JSON.stringify(draft, null, 2))}>{t("Export current stage edits")}</button>}</p>}{!draft ? <button className="v-button mt-4" onClick={() => load()}>{t("Review current stage profile")}</button> : <form className="mt-4 space-y-4" onSubmit={save}>{[['board', 'Stage board or source'], ['classLevel', 'Stage class level'], ['institution', 'Stage institution'], ['stage', 'Education stage'], ['exam', 'Stage exam'], ['subjectsText', 'Stage subjects, separated by commas']].map(([key, label]) => <label className="block text-sm" key={key}>{t(label)}{key === 'stage' ? <select aria-label={t(label)} className="v-field mt-2" value={draft.stage || ""} onChange={event => edit('stage', event.target.value)}><option value="">{t("Not set")}</option>{draft.stage && !['school', 'competitive', 'vocational', 'higher_ed', 'professional'].includes(draft.stage) && <option value={draft.stage}>{draft.stage}</option>}<option value="school">{t("School")}</option><option value="competitive">{t("Competitive preparation")}</option><option value="vocational">{t("Vocational learning")}</option><option value="higher_ed">{t("Higher education")}</option><option value="professional">{t("Professional learning")}</option></select> : <input className="v-field mt-2" maxLength={key === 'subjectsText' ? 500 : 100} value={draft[key] || ""} onChange={event => edit(key, event.target.value)} />}</label>)}<p className="v-muted">{t("Calendar and evidence triggers cannot bypass a pending stage decision. Evidence suggestions never change your profile automatically.")}</p><div className="flex flex-wrap gap-3"><button className="v-button primary">{t("Save stage profile")}</button><button type="button" className="v-button" onClick={() => load(true)}>{t("Discard edits and reload current stage")}</button></div></form>}{suggestions.map(item => <div className="mt-4 rounded-xl border border-slate-200 p-3" key={item.id}><h3 className="font-medium">{t("Stage suggestion \xB7 not applied")}</h3><p className="v-muted mt-2" lang="en">{item.reason}</p><p className="mt-2 text-sm">{t("Proposed:")} {item.to.classLevel || item.to.stage || t("updated subjects")} · {item.to.board || t("source not set")}</p><div className="mt-3 flex flex-wrap gap-3"><button className="v-button" onClick={() => respond(item.id, true)}>{t("Review and accept suggestion")}</button><button className="v-button" onClick={() => respond(item.id, false)}>{t("Dismiss suggestion")}</button></div></div>)}<Link className="v-button mt-4" to="/dashboard/home">{t("View stage notice on Home")}</Link></section>;
}
