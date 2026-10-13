import { teacherCopy } from '@/lib/teacherCopy';
import { useRef, useEffect, useState } from 'react';
import { teacherObjectiveChoices, prepareTeacherObjective } from '@/services/classroomService';
import { SAMPLE_SELECTION } from '@/services/contentRepository';
import LessonObjectivePreview from './LessonObjectivePreview';
import { assertLessonObjective } from '@/services/lessonObjective';
export default function LessonObjectivePicker({
  ctx,
  objective,
  onChange,
  interfaceLocale = 'en'
}) {
  const copy = teacherCopy(interfaceLocale);
  if (objective) try {
    assertLessonObjective(objective);
  } catch (failure) {
    return <section className="v-card" lang={interfaceLocale}><p role="alert" className="v-notice v-error"><span lang="en">{failure.message}</span> {copy('The saved original has not been replaced.')}</p><button type="button" className="v-button mt-3" onClick={() => onChange(null)}>{copy("Remove invalid objective from this draft")}</button></section>;
  }
  return <ObjectivePicker interfaceLocale={interfaceLocale} ctx={ctx} objective={objective} onChange={onChange} />;
}
function ObjectivePicker({
  ctx,
  objective,
  onChange,
  interfaceLocale
}) {
  const copy = teacherCopy(interfaceLocale);
  const [selection, setSelection] = useState(objective?.selection || SAMPLE_SELECTION);
  const [locale, setLocale] = useState(objective?.locale || ctx.locale);
  const [loaded, setLoaded] = useState(null);
  const [conceptId, setConceptId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  useEffect(() => () => {
    sequence.current++;
  }, []);
  function changeSelection(patch) {
    sequence.current++;
    setSelection(current => ({
      ...current,
      ...patch
    }));
    setLoaded(null);
    setConceptId('');
    setBusy(false);
    setError('');
  }
  async function load() {
    const current = ++sequence.current;
    setBusy(true);
    setError('');
    setLoaded(null);
    try {
      const result = await teacherObjectiveChoices({
        ...ctx,
        locale
      }, selection);
      if (current === sequence.current) {
        setLoaded(result);
        setConceptId(result.choices[0]?.id || '');
      }
    } catch (failure) {
      if (current === sequence.current) setError(failure.message);
    } finally {
      if (current === sequence.current) setBusy(false);
    }
  }
  async function attach() {
    const current = ++sequence.current;
    setBusy(true);
    setError('');
    try {
      const snapshot = await prepareTeacherObjective({
        ...ctx,
        locale
      }, {
        selection,
        conceptId,
        expectedSource: JSON.stringify(loaded.syllabus.provenance)
      });
      if (current === sequence.current) onChange(snapshot);
    } catch (failure) {
      if (current === sequence.current) setError(failure.message);
    } finally {
      if (current === sequence.current) setBusy(false);
    }
  }
  return <section className="v-card" lang={interfaceLocale}><h2 className="text-base font-medium">{copy("Attach a curriculum objective")}</h2><p className="v-muted mt-2">{copy("Choose sourced content, preview it, then review and save your lesson before assigning. The existing Sample mathematics activities are demonstrations. A real book has not been processed.")}</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{[['board', 'Board or source'], ['classLevel', 'Class or level'], ['subject', 'Subject']].map(([key, label]) => <label className="text-sm" key={key}>{copy(label)}<input aria-label={copy(label)} className="v-field mt-2" maxLength={100} value={selection[key]} onChange={event => changeSelection({
          [key]: event.target.value
        })} /></label>)}<label className="text-sm">{copy("Objective language")}<select aria-label={copy("Objective language")} className="v-field mt-2" value={locale} onChange={event => {
          sequence.current++;
          setLocale(event.target.value);
          setLoaded(null);
          setConceptId('');
          setBusy(false);
          setError('');
        }}><option value="en">{copy("English")}</option><option value="hi">हिन्दी</option><option value="bn">বাংলা</option></select></label></div><button type="button" className="v-button mt-4" disabled={busy || Object.values(selection).some(value => !value.trim())} onClick={load}>{copy(busy ? 'Loading objective…' : 'Load sourced objectives')}</button>{error && <p role="alert" className="v-notice v-error mt-3"><span lang="en">{error}</span></p>}{loaded && <div className="mt-4"><p className="v-muted">{loaded.syllabus.provenance?.provider} · {copy('Version {version}', {
          version: loaded.syllabus.provenance?.version
        })}</p>{loaded.choices.length ? <><label className="mt-3 block text-sm">{copy("Curriculum objective")}<select aria-label={copy("Curriculum objective")} className="v-field mt-2" value={conceptId} onChange={event => {
            sequence.current++;
            setConceptId(event.target.value);
            setBusy(false);
          }}>{loaded.choices.map(choice => <option value={choice.id} key={choice.id}>{[choice.bookTitle, choice.chapter, choice.title].filter(Boolean).join(' · ')}</option>)}</select></label><button type="button" className="v-button mt-3" disabled={busy || !conceptId} onClick={attach}>{copy("Attach selected objective")}</button></> : <p role="status" className="mt-3 text-sm">{copy("No sourced objectives are available in this outline.")}</p>}</div>}{objective && <><LessonObjectivePreview key={JSON.stringify(objective)} objective={objective} /><button type="button" className="v-button mt-4" onClick={() => {
        sequence.current++;
        setBusy(false);
        onChange(null);
      }}>{copy("Remove attached objective")}</button></>}<p className="v-muted mt-3">{copy("Attaching or removing an objective returns this lesson to draft for your review. Teacher questions remain separate written-response prompts.")}</p></section>;
}
