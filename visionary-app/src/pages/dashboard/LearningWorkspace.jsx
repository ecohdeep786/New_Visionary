import { learningCopy, learningDate } from '@/lib/learningCopy';
import { requireBridgeObjective, getCurriculumBridge, startReviewedBridgeObjective } from '@/services/curriculumBridgeService';
import { downloadText } from '@/lib/downloadText';
import { workspaceIdentity } from '@/services/workspaceService';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Target } from 'lucide-react';
import WorkspaceIntro from '@/components/dashboard/WorkspaceIntro';
import LearningRepresentation from '@/components/dashboard/LearningRepresentation';
import LearningAttemptHistory from '@/components/dashboard/LearningAttemptHistory';
import LearningPrerequisites from '@/components/dashboard/LearningPrerequisites';
import ContentIssueReport from '@/components/dashboard/ContentIssueReport';
import ClassworkLearningPlayer from './ClassworkLearningPlayer';
import ClassworkStudy from './ClassworkStudy';
import { useAuth } from '@/lib/AuthContext';
import { useWorkspace } from '@/hooks/useWorkspace';
import { getContentRepository, SAMPLE_SELECTION, PROFESSIONAL_SAMPLE_SELECTION } from '@/services/contentRepository';
import { getStudentState, getStudentClassLearningContext } from '@/services/mentorStateService';
import { getLearningWorkspace, getLearningUnit, learningAnswerSelection, saveLearningAnswerDraft, assertLearningSource, getLearningReviewQueue, selectLearningSyllabus, startLearningUnit, requestUnitTeaching, beginComprehension, answerLearningQuestion, nextLearningQuestion, createLearningProject, flushLearningOutcome, updateLearningLanguage, updateLearningRepresentation, reviewLearningExplanation } from '@/services/learningPipelineService';
const languageNames = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা'
};
export default function LearningWorkspace(props) {
  const [params] = useSearchParams();
  return !props.unitIdOverride && params.get('bridgeTransition') ? <BridgeObjectiveEntry transitionId={params.get('bridgeTransition')} conceptId={params.get('bridgeConcept')} /> : !props.unitIdOverride && params.get('assignment') ? props.practice ? <ClassworkStudy assignmentId={params.get('assignment')} mode="practice" /> : <ClassworkLearningPlayer assignmentId={params.get('assignment')} /> : <CurriculumLearningWorkspace {...props} />;
}
function BridgeObjectiveEntry({
  transitionId,
  conceptId
}) {
  const {
      ctx,
      data,
      revision,
      error: workspaceError
    } = useWorkspace(),
    [, setParams] = useSearchParams();
  const locale = data?.preferences.interfaceLocale || 'en';
  const copy = learningCopy(locale);
  const [error, setError] = useState(''),
    [retry, setRetry] = useState(0),
    [busy, setBusy] = useState(false);
  const request = useRef(null);
  useEffect(() => {
    setBusy(false);
    setError('');
    return () => {
      request.current?.abort();
    };
  }, [ctx?.personId, ctx?.workspaceId, ctx?.locale, transitionId, conceptId]);
  const view = useMemo(() => {
    if (!ctx) return null;
    try {
      const target = requireBridgeObjective(ctx, transitionId, conceptId);
      const plan = getCurriculumBridge(ctx, transitionId);
      const units = getLearningWorkspace(ctx).units;
      return {
        target,
        originals: plan.rows.filter(row => row.status === 'equivalent' && row.target?.id === conceptId).map(row => ({
          ...row,
          unit: units.find(unit => unit.id === row.unitId)
        }))
      };
    } catch (failure) {
      return {
        error: failure.message
      };
    }
  }, [ctx?.personId, ctx?.workspaceId, ctx?.locale, revision, transitionId, conceptId, retry]);
  async function start() {
    if (busy) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    try {
      const unit = await startReviewedBridgeObjective({
        ...ctx,
        signal: controller.signal
      }, transitionId, conceptId);
      if (!controller.signal.aborted) setParams({
        unit: unit.id
      }, {
        replace: true
      });
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  if (workspaceError || view?.error) return <div className="v-page" lang={locale}><h1 className="v-title">{copy("Bridge activity unavailable")}</h1><p role="alert" className="v-notice v-error">{workspaceError || view.error}</p><button className="v-button mt-3" onClick={() => setRetry(value => value + 1)}>{copy("Retry bridge activity")}</button><Link className="v-button mt-3" to="/dashboard/home">{copy("Return Home")}</Link></div>;
  if (!view) return <div className="v-page" role="status" lang={locale}>{copy("Reading the sourced bridge objective\u2026")}</div>;
  return <div className="v-page" lang={locale}><header><h1 className="v-title">{copy("Continue across curriculum sources")}</h1><p className="v-muted mt-2">{view.target.title} · {view.target.source?.provider} {copy("\xB7 version")} {view.target.source?.version}</p></header>
 <section className="v-card"><h2 className="text-lg font-medium">{copy("Your original work is retained")}</h2><p className="v-muted mt-2">{copy("Resume its saved explanation, check, practice or project on the original source. Recorded answers and review dates are not moved to the new curriculum.")}</p>{view.originals.length ? view.originals.map(row => <article className="mt-4 rounded-xl border p-3" key={row.unitId}><h3 className="font-medium">{row.title}</h3><p className="v-muted mt-2">{copy("Saved step:")} {row.unit?.stage} · {row.reason}</p><Link className="v-button mt-3" to={row.originalPath}>{copy("Resume original work")}<span className="sr-only">: {row.title}</span></Link></article>) : <p className="v-muted mt-3">{copy("No reviewed equivalent original activity is available for this objective. Your other saved work remains accessible from Home.")}</p>}</section>
 <section className="v-card"><h2 className="text-lg font-medium">{copy("Open the reviewed objective")}</h2><p className="v-muted mt-2">{copy("New-source work starts with its own explanation and checks. An existing unfinished activity on this exact source resumes its saved step. Prior mastery, answers, question drafts and project reviews are not copied.")}</p>{view.target.prerequisites.length > 0 && <ul className="mt-3 list-disc space-y-2 pl-5">{view.target.prerequisites.map(item => <li key={item.id}>{item.title} · {item.priorReadiness ? copy("Prior recorded readiness; review remains available") : copy("Review this prerequisite before starting")}</li>)}</ul>}<button className="v-button primary mt-4" disabled={busy} onClick={start}>{busy ? copy("Opening reviewed objective\u2026") : copy("Start or resume reviewed objective")}</button>{error && <p className="v-notice v-error mt-3" role="alert">{error}</p>}</section><Link className="v-button" to="/dashboard/home">{copy("Return Home")}</Link></div>;
}
function CurriculumLearningWorkspace({
  practice = false,
  unitIdOverride
}) {
  const {
    ctx,
    data,
    error: workspaceError
  } = useWorkspace();
  const locale = data?.preferences.interfaceLocale || 'en';
  const copy = learningCopy(locale);
  const {
    user
  } = useAuth();
  const [params, setParams] = useSearchParams();
  const [selection, setSelection] = useState(() => {
    const fallback = {
      board: user?.board || '',
      classLevel: user?.grade_level || '',
      subject: Array.isArray(user?.subjects) ? user.subjects[0] || '' : ''
    };
    try {
      return ctx ? getLearningWorkspace(ctx).selection || fallback : fallback;
    } catch {
      return fallback;
    }
  });
  const [syllabus, setSyllabus] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [topics, setTopics] = useState([]);
  const [unit, setUnit] = useState(null);
  const [concept, setConcept] = useState(null);
  const [classContext, setClassContext] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [rename, setRename] = useState('');
  const [contentRetry, setContentRetry] = useState(0);
  const [renderedWorkspaceId, setRenderedWorkspaceId] = useState(ctx?.workspaceId || '');
  const unitId = unitIdOverride || params.get('unit');
  const chapterId = params.get('chapter');
  const fromClassId = params.get('fromClass');
  useEffect(() => {
    let live = true;
    if (!ctx) return;
    setError('');
    setBusy(true);
    setUnit(null);
    setConcept(null);
    setSyllabus(null);
    setChapter(null);
    setTopics([]);
    setClassContext(null);
    (async () => {
      if (unitId) {
        const saved = flushLearningOutcome(ctx, unitId);
        const repo = getContentRepository({
          ...ctx,
          locale: saved.locale
        });
        const content = await repo.getConcept(saved.conceptId);
        if (live) setUnit(saved);
        if (content) assertLearningSource(saved, content);
        if (live) {
          setConcept(content);
          setAnswer(learningAnswerSelection(saved));
        }
        if (!content) {
          if (live) setError('The teaching content for this saved concept could not be loaded.');
          return;
        }
        const path = getLearningWorkspace(ctx);
        if (chapterId && path.syllabusId) {
          const chapters = await repo.getChapters(path.syllabusId);
          const selected = chapters.find(item => item.id === chapterId);
          if (!selected) throw Error('This chapter link is no longer in your learning outline.');
          const chapterTopics = await repo.getTopics(selected.id);
          const rows = await Promise.all(chapterTopics.map(async topic => ({
            ...topic,
            concepts: await repo.getConcepts(topic.id)
          })));
          if (!rows.some(row => row.concepts.some(item => item.id === saved.conceptId))) throw Error('This chapter link does not contain your saved concept.');
          if (live) {
            setChapter(selected);
            setTopics(rows);
          }
        }
      } else {
        const profile = {
          board: user?.board || '',
          classLevel: user?.grade_level || '',
          subject: Array.isArray(user?.subjects) ? user.subjects[0] || '' : ''
        };
        const connected = fromClassId ? getStudentClassLearningContext(ctx, fromClassId) : null;
        const saved = connected ? {
          ...profile,
          subject: connected.subject
        } : getLearningWorkspace(ctx).selection || profile;
        if (saved.subject) {
          const outline = await selectLearningSyllabus(ctx, saved);
          let selected = null;
          let rows = [];
          if (chapterId) {
            selected = outline.chapters.find(item => item.id === chapterId);
            if (!selected) throw Error('This chapter is not in your current learning outline.');
            const repo = getContentRepository(ctx);
            const chaptersTopics = await repo.getTopics(selected.id);
            rows = await Promise.all(chaptersTopics.map(async topic => ({
              ...topic,
              concepts: await repo.getConcepts(topic.id)
            })));
          }
          if (live) {
            setSelection(saved);
            setSyllabus(outline);
            setClassContext(connected);
            setChapter(selected);
            setTopics(rows);
            setRename(selected?.status === 'provisional' ? selected.title : '');
          }
        } else if (live) {
          setSelection(saved);
          setClassContext(connected);
        }
      }
    })().catch(e => {
      if (live) setError(e.message);
    }).finally(() => {
      if (live) {
        setBusy(false);
        setRenderedWorkspaceId(ctx.workspaceId);
      }
    });
    return () => {
      live = false;
    };
  }, [ctx?.personId, ctx?.workspaceId, ctx?.locale, unitId, chapterId, fromClassId, contentRetry]);
  async function run(work) {
    setBusy(true);
    setError('');
    try {
      await work();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function openOutline(value) {
    run(async () => {
      const result = await selectLearningSyllabus(ctx, value);
      setSelection(value);
      setSyllabus(result);
      setChapter(null);
      setTopics([]);
      setClassContext(null);
      setParams({});
    });
  }
  function openChapter(value) {
    setParams({
      ...(fromClassId ? {
        fromClass: fromClassId
      } : {}),
      chapter: value.id
    });
  }
  async function openConcept(id) {
    const activity = await startLearningUnit(ctx, id, fromClassId || undefined);
    const inChapter = chapter && topics.some(topic => topic.concepts.some(item => item.id === id));
    setParams({
      ...(fromClassId ? {
        fromClass: fromClassId
      } : {}),
      ...(inChapter ? {
        chapter: chapter.id
      } : {}),
      unit: activity.id
    });
  }
  async function changeUnit(work) {
    const next = await work();
    setUnit(next);
    setAnswer(learningAnswerSelection(next));
  }
  async function chooseLanguage(value) {
    const next = await updateLearningLanguage(ctx, unit.id, value);
    const translated = await getContentRepository({
      ...ctx,
      locale: next.locale
    }).getConcept(next.conceptId);
    setUnit(next);
    setConcept(translated);
  }
  if (workspaceError || !ctx) return <div className="v-page" role={workspaceError ? 'alert' : 'status'} lang={locale}>{workspaceError || copy('Opening your learning workspace…')}</div>;
  if (renderedWorkspaceId !== ctx.workspaceId) return <div className="v-page" role="status" aria-busy="true" lang={locale}>{copy("Opening this workspace\u2026")}</div>;
  if (unitId && unit?.id !== unitId && busy) return <div className="v-page" role="status" aria-busy="true" lang={locale}>{copy("Restoring your saved learning activity\u2026")}</div>;
  if (!unitId && unit) return <div className="v-page" role="status" aria-busy="true" lang={locale}>{copy("Opening your learning outline\u2026")}</div>;
  const professional = ctx.role === 'professional';
  let state, saved, reviewQueue;
  try {
    state = getStudentState(ctx);
    saved = getLearningWorkspace(ctx).units;
    reviewQueue = practice ? getLearningReviewQueue(ctx) : [];
  } catch (cause) {
    return <div className="v-page" lang={locale}><h1 className="v-title">{copy("Saved learning unavailable")}</h1><p className="v-notice v-error" role="alert">{cause.message}</p><p className="v-muted mt-3">{copy("Original records remain on this device. This page will not replace them or record an answer while they are unreadable. Restore a valid saved copy before retrying.")}</p>{unit && <button className="v-button mt-4" onClick={() => {
        try {
          workspaceIdentity(ctx);
          downloadText('current-activity-view.json', JSON.stringify({
            title: unit.title,
            stage: unit.stage,
            source: unit.sourceContext,
            question: unit.question ? {
              id: unit.question.id,
              prompt: unit.question.prompt,
              options: unit.question.options
            } : undefined,
            selectedIndex: answer === '' ? undefined : Number(answer)
          }, null, 2), 'application/json');
        } catch (failure) {
          setError(failure.message);
        }
      }}>{copy("Export current activity view")}</button>}{error && error !== cause.message && <p className="v-notice v-error mt-3" role="alert">{error}</p>}<div className="mt-4 flex flex-wrap gap-3"><button className="v-button" onClick={() => setContentRetry(value => value + 1)}>{copy("Retry saved learning")}</button><Link className="v-button" to="/dashboard/privacy">{copy("Review local data and export")}</Link></div></div>;
  }
  const evidence = unit ? state.concepts.find(c => c.conceptId === unit.conceptId) : null;
  const outlineQuery = new URLSearchParams({
    ...(fromClassId ? {
      fromClass: fromClassId
    } : {}),
    ...(chapterId ? {
      chapter: chapterId
    } : {})
  }).toString();
  const outlineUrl = `/dashboard/learn${outlineQuery ? `?${outlineQuery}` : ''}`;
  const chapterConcepts = topics.flatMap(topic => topic.concepts);
  const startedConcepts = chapterConcepts.filter(item => saved.some(activity => activity.conceptId === item.id)).length;
  const nextConcept = chapterConcepts.find(item => saved.some(activity => activity.conceptId === item.id && activity.stage !== 'completed')) || chapterConcepts.find(item => !saved.some(activity => activity.conceptId === item.id)) || chapterConcepts[0];
  const chapterIndex = unit ? chapterConcepts.findIndex(item => item.id === unit.conceptId) : -1;
  const followingConcept = chapterIndex >= 0 ? chapterConcepts.slice(chapterIndex + 1).find(item => !saved.some(activity => activity.conceptId === item.id && activity.stage === 'completed')) : null;
  const status = <>{busy && <p role="status" className="v-muted">{copy("Saving your place\u2026")}</p>}{error && <div role="alert" className="v-notice v-error"><span lang="en">{error}</span> {copy('Your saved work is kept.')} {!unitId && (chapterId || fromClassId) && <button className="v-button ml-3" onClick={() => setParams({})}>{copy("Open my outline")}</button>}</div>}</>;
  if (unitId && !unit && !busy) return <div className="v-page" lang={locale}><h1 className="v-title">{copy("Learning activity unavailable")}</h1>{status}<p className="v-muted mt-4">{copy("Open your outline to choose an available concept. This link did not create or score an activity.")}</p><div className="mt-5 flex flex-wrap gap-3"><Link className="v-button primary" to={outlineUrl}>{copy("Open learning outline")}</Link><button className="v-button" onClick={() => setContentRetry(value => value + 1)}>{copy("Retry activity")}</button></div></div>;
  if (unitId && unit && !concept && !busy) return <div className="v-page" lang={locale}><p className="v-home-eyebrow">{copy("Saved learning activity")}</p><h1 className="v-title mt-2">{copy("Teaching content unavailable")}</h1>{status}<p className="v-muted mt-4">{copy("This activity is still saved locally. No check, practice or mastery result was added while the content was unavailable.")}</p><div className="mt-5 flex flex-wrap gap-3"><Link className="v-button primary" to={outlineUrl}>{copy("Open learning outline")}</Link><Link className="v-button" to={`/dashboard/ask?learning=${encodeURIComponent(unit.id)}`}>{copy("Ask about this activity")}</Link><button className="v-button" onClick={() => setContentRetry(value => value + 1)}>{copy("Retry content")}</button></div></div>;
  if (unit && concept) return <div className="v-page" lang={locale}>
  <header><Link className="v-button" to={outlineUrl}><ArrowLeft size={16} />{copy("Learning outline")}</Link><p className="v-home-eyebrow mt-5">{concept.status === 'sample' ? copy("Authored sample \xB7 Not official curriculum") : concept.status === 'provisional' ? copy("Provisional learning outline") : concept.provenance ? copy('Sourced curriculum · {provider} · version {version}', {
          provider: concept.provenance.provider,
          version: concept.provenance.version
        }) : copy("Saved curriculum \xB7 source details unavailable")}</p><h1 className="v-title mt-2" lang={concept.locale || undefined}>{concept.title}</h1><p className="v-muted mt-3">{copy("Your place is saved locally. Understanding is checked before guided practice and building.")}</p><label className="mt-4 block max-w-xs text-sm">{copy("Teaching language")}<select aria-label={copy("Teaching language")} className="v-field mt-2" value={unit.locale} disabled={busy} onChange={e => run(() => chooseLanguage(e.target.value))}><option value="en">English</option><option value="hi">हिन्दी</option><option value="bn">বাংলা</option></select></label>{concept.languageUnavailable && <div className="v-notice mt-4" role="status"><p>{copy('This concept’s saved teaching content is not loaded in {language}. Your place and evidence remain saved. A teaching response requires the connected model.', {
            language: languageNames[unit.locale]
          })} {concept.locale && copy('The outline text is in {language}.', {
            language: languageNames[concept.locale]
          })}</p>{concept.locale && concept.locale !== unit.locale && <button className="v-button mt-3" disabled={busy} onClick={() => run(() => chooseLanguage(concept.locale))}>{copy('Use available {language} teaching', {
            language: languageNames[concept.locale]
          })}</button>}</div>}</header>
  {status}
  <LearningPrerequisites ctx={ctx} conceptId={concept.id} onOpen={id => run(() => openConcept(id))} />
  <nav className="v-learning-stages" aria-label={copy("Learning unit stages")}>{[['explain', 'Understand'], ['check', 'Check'], ['practice', 'Practice'], ['build', 'Build']].map(([id, label], index) => <span className="v-learning-step" key={id} aria-current={unit.stage === id || unit.stage === 'completed' && id === 'build' ? 'step' : undefined}><span aria-hidden="true">{index + 1}</span>{copy(label)}</span>)}</nav>
  {unit.response && <p role="status" className={`v-notice ${unit.response.status === 'blocked' ? 'v-error' : ''}`} lang={unit.response.status === 'not_connected' ? 'en' : unit.locale}>{unit.response.status === 'ready' ? copy("Teaching service response received.") : unit.response.text}</p>}
   {unit.stage === 'explain' && <section className="v-card"><h2 className="text-lg font-medium">{copy("Understand one idea")}</h2>{unit.explanation ? <><p className="mt-4 whitespace-pre-wrap leading-8" lang={unit.response?.status === 'ready' ? unit.locale : concept.locale || unit.locale}>{unit.explanation}</p><p className="v-muted mt-3">{unit.response?.status === 'ready' ? copy("Source: connected teaching adapter.") : concept.status === 'sample' ? copy("Source: explicitly authored sample content, not a generated model answer.") : concept.provenance ? copy('Source: {provider} · version {version}.', {
            provider: concept.provenance.provider,
            version: concept.provenance.version
          }) : copy("Source details are unavailable for this saved content.")}</p><button className="v-button primary mt-5" disabled={busy || unit.response?.status === 'blocked'} onClick={() => run(() => changeUnit(() => beginComprehension(ctx, unit.id)))}>{copy("Check my understanding")}<ArrowRight size={16} /></button></> : <><p className="v-muted mt-3">{unit.response ? copy("An explanation is unavailable in this language right now. Your position is saved; no understanding check has been scored.") : concept.languageUnavailable ? copy('Saved teaching is not available in {language}. You can use the available source language above or request a connected teaching response.', {
            language: languageNames[unit.locale]
          }) : concept.status === 'sample' ? copy("Request an explanation in your selected teaching language. If the service is disconnected, available authored sample content can still be used.") : copy("Request an explanation in your selected teaching language. If no sourced explanation is available while the teaching service is disconnected, this step cannot advance.")}</p><div className="mt-5 flex flex-wrap gap-3"><button className="v-button primary" disabled={busy} onClick={() => run(() => changeUnit(() => requestUnitTeaching(ctx, unit.id, 'explanation')))}>{unit.response ? copy("Retry teaching connection") : copy("Start this learning unit")}</button>{unit.response && <Link className="v-button" to={`/dashboard/ask?learning=${encodeURIComponent(unit.id)}`}>{copy("Ask a doubt instead")}</Link>}</div></>}
   {concept.representations.length > 0 && <LearningRepresentation contentLocale={unit.locale} descriptors={concept.representations} value={unit.representation} preferText={data?.preferences.lowBandwidth} disabled={busy} onChange={patch => setUnit(updateLearningRepresentation(ctx, unit.id, patch))} />}
   <LearningAttemptHistory attempts={unit.attempts} locale={unit.locale} />
  </section>}
  {['check', 'practice'].includes(unit.stage) && <section className="v-card"><h2 className="text-lg font-medium">{unit.stage === 'check' ? copy("Check understanding") : copy("Practice one step at a time")}</h2><p className="v-muted mt-2">{copy('Difficulty {level} / 5', {
          level: unit.difficulty
        })} · {evidence ? copy('{correct}/{total} recorded correct answers', {
          correct: evidence.correct,
          total: evidence.total
        }) : copy("No assessment evidence yet")}</p>
   {unit.question && unit.response?.status !== 'blocked' ? <><fieldset className="mt-5" disabled={busy || !!unit.answer}><legend className="mb-4 text-base leading-7" lang={unit.response?.status === 'ready' ? unit.locale : concept.locale || unit.locale}>{unit.question.prompt}</legend>{unit.question.options.map((option, index) => <label className="v-list-row justify-start gap-3" key={index}><input type="radio" name="concept-answer" value={index} checked={answer === String(index)} onChange={e => {
              setAnswer(e.target.value);
              try {
                const saved = saveLearningAnswerDraft(ctx, unit.id, Number(e.target.value), JSON.stringify(unit.question), unit.practiceRound);
                setUnit(saved);
                setError('');
              } catch (failure) {
                setError(failure.message);
              }
            }} /><span lang={unit.response?.status === 'ready' ? unit.locale : concept.locale || unit.locale}>{option}</span></label>)}</fieldset>{!unit.answer && answer !== '' && <p className="v-muted mt-3" role="status">{learningAnswerSelection(unit) === answer ? copy("Selection saved as a private draft. It is scored only when you choose Check answer.") : copy("This selection is only on this page. Retry saving it before leaving, or keep the page open.")}</p>}{!unit.answer ? <button className="v-button primary mt-5" disabled={busy || answer === ''} onClick={() => run(() => changeUnit(() => answerLearningQuestion(ctx, unit.id, Number(answer), {
          version: JSON.stringify(unit.question),
          round: unit.practiceRound
        })))}>{copy("Check answer")}</button> : <div className="mt-5" role="status"><p>{unit.answer.correct ? copy("Correct for this recorded check.") : copy("Not yet. Review the idea and try a smaller step.")}</p><p className="v-muted mt-2">{copy("Accuracy is evidence, not a claim of overall mastery.")} {unit.question.source === 'authored-sample' ? copy("This check comes from the authored sample.") : ''}</p><div className="mt-4 flex flex-wrap gap-3"><button className="v-button" disabled={busy} onClick={() => run(() => changeUnit(() => nextLearningQuestion(ctx, unit.id, unit.checkPassed)))}>{unit.checkPassed ? copy("Continue practice") : copy("Retry understanding check")}</button><button className="v-button" disabled={busy} onClick={() => run(() => changeUnit(() => reviewLearningExplanation(ctx, unit.id)))}>{copy("Review explanation and model")}</button>{unit.practicePassed && <button className="v-button primary" disabled={busy} onClick={() => run(async () => {
              await createLearningProject(ctx, unit.id);
              setUnit(getLearningUnit(ctx, unit.id));
            })}>{copy("Apply this in Build")}</button>}</div></div>}</> : <div className="mt-5"><p className="v-muted">{copy("No verifiable question is available yet. Your progress has not been advanced or scored.")}</p><div className="mt-4 flex flex-wrap gap-3"><button className="v-button" disabled={busy} onClick={() => run(() => changeUnit(() => requestUnitTeaching(ctx, unit.id, 'practice')))}>{copy("Retry teaching connection")}</button><button className="v-button" disabled={busy} onClick={() => run(() => changeUnit(() => reviewLearningExplanation(ctx, unit.id)))}>{copy("Review explanation")}</button><Link className="v-button" to={`/dashboard/ask?learning=${encodeURIComponent(unit.id)}`}>{copy("Ask a doubt")}</Link></div></div>}
   <LearningAttemptHistory attempts={unit.attempts} locale={unit.locale} />
  </section>}
  {['build', 'completed'].includes(unit.stage) && <section className="v-card"><CheckCircle2 aria-hidden="true" /><h2 className="mt-3 text-lg font-medium">{unit.stage === 'completed' ? copy("Your application is recorded") : copy("Put the idea to work")}</h2><p className="v-muted mt-3">{concept.project?.brief || 'Define an outcome, create an artifact, and reflect on the evidence.'}</p><div className="mt-5 flex flex-wrap gap-3"><Link className="v-button primary" to={`/dashboard/build?artifact=${encodeURIComponent(unit.artifactId || '')}`}>{copy("Open your project")}</Link><button className="v-button" disabled={busy} onClick={() => run(() => changeUnit(() => requestUnitTeaching(ctx, unit.id, 'project')))}>{copy("Request project guidance")}</button>{unit.stage === 'completed' && <button className="v-button" disabled={busy} onClick={() => run(async () => {
          const review = await startLearningUnit(ctx, unit.conceptId, unit.classId);
          setParams({
            ...(unit.classId ? {
              fromClass: unit.classId
            } : {}),
            ...(chapter ? {
              chapter: chapter.id
            } : {}),
            unit: review.id
          });
        })}>{copy("Review this concept again")}</button>}</div>{unit.stage === 'completed' && <p className="v-muted mt-3 text-sm">{copy("A review opens a new learning activity. This project and its recorded evidence stay saved.")}</p>}</section>}
  {unit.stage === 'completed' && chapter && <section className="v-card"><p className="v-home-eyebrow">{copy('{title} · chapter path', {
          title: chapter.title
        })}</p>{followingConcept ? <><h2 className="mt-2 text-lg font-medium">{copy('Next: {title}', {
            title: followingConcept.title
          })}</h2>{followingConcept.prerequisiteIds.length > 0 && <LearningPrerequisites ctx={ctx} conceptId={followingConcept.id} onOpen={id => run(() => openConcept(id))} />}<button className="v-button primary mt-4" disabled={busy} onClick={() => run(() => openConcept(followingConcept.id))}>{copy("Continue to next concept")}<ArrowRight size={16} /></button></> : <><h2 className="mt-2 text-lg font-medium">{copy("You reached the end of this available chapter")}</h2><p className="v-muted mt-2">{copy("This records the activities shown here, not mastery of the whole subject.")}</p></>}</section>}
  <div className="flex flex-wrap gap-3"><Link className="v-button" to={`/dashboard/ask?learning=${encodeURIComponent(unit.id)}`}>{copy("Ask a doubt \xB7 keep my place")}</Link><Link className="v-button" to="/dashboard/home">{copy("Save and return Home")}</Link></div>
  <ContentIssueReport key={`${concept.id}:${unit.locale}`} ctx={ctx} concept={concept} locale={unit.locale} />
 </div>;
  return <div className="v-page" lang={locale}><WorkspaceIntro eyebrow={practice ? copy("Review and strengthen") : copy("Explore and understand")} title={practice ? copy("Your next practice") : copy("Your learning outline")} description={practice ? copy("Revisit what you have already checked. Your results and next step stay connected to Learn.") : professional ? copy("Connect a skill goal to concepts, practice and portfolio work.") : copy("Subjects become chapters, concepts, checks and projects\u2014with your place kept at every step.")} icon={practice ? Target : BookOpen} />{status}
  {classContext && <div className="v-notice flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{copy('Learning alongside {name}', {
            name: classContext.name
          })}</p><p className="v-muted mt-1 hidden sm:block">{copy("This outline uses your class subject. Assignments and teacher feedback remain in Classes.")}</p></div><Link className="v-button" to={`/dashboard/classes?class=${encodeURIComponent(classContext.id)}`}>{copy("Classwork")}</Link></div>}
  {practice && <section className="v-card"><h2 className="text-lg font-medium">{copy("Ready to revisit")}</h2>{reviewQueue.length ? reviewQueue.map(({
        unit: u,
        due,
        dueAt,
        recordedAnswers
      }) => <div className="v-list-row" key={u.id}><div><p>{u.title}</p><p className="v-muted mt-1 text-sm">{due ? copy("Due for review") : dueAt ? copy('Next review {date}', {
              date: learningDate(dueAt, locale)
            }) : copy("Review available")} · {copy('{count} recorded answers', {
              count: recordedAnswers
            })}</p></div><button className="v-button" disabled={busy} onClick={() => run(async () => {
          if (u.stage === 'completed') {
            const fresh = await startLearningUnit(ctx, u.conceptId, u.classId);
            setParams({
              unit: fresh.id
            });
            return;
          }
          if (u.stage === 'practice' && u.question && !u.answer) {
            setParams({
              unit: u.id
            });
            return;
          }
          await nextLearningQuestion(ctx, u.id, true);
          setParams({
            unit: u.id
          });
        })}>{u.stage === 'completed' ? copy("Start review") : u.stage === 'practice' && !u.answer ? copy("Resume practice") : copy('Practice')}</button></div>) : <><p className="v-muted mt-3">{copy("Finish a comprehension check in Learn first. No weakness is inferred from an empty history.")}</p><Link className="v-button primary mt-5" to="/dashboard/learn">{copy("Start in Learn")}<ArrowRight size={16} /></Link></>}</section>}
  {!practice && <details open={!syllabus} className="v-card"><summary className="cursor-pointer font-medium">{professional ? copy("Choose a capability") : copy("Choose a subject")}</summary><form className="mt-5 grid gap-4" onSubmit={e => {
        e.preventDefault();
        openOutline(selection);
      }}><label className="max-w-xl text-sm">{professional ? copy("Skill or capability (optional)") : copy("Subject (optional)")}<input className="v-field mt-2" maxLength={100} placeholder={professional ? copy("For example, data interpretation") : copy("For example, mathematics")} value={selection.subject} onChange={e => setSelection({
            ...selection,
            subject: e.target.value
          })} /></label><details className="max-w-xl"><summary className="cursor-pointer text-sm text-[#1967d2]">{professional ? copy("Add goal and level") : copy("Add board and class")}</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">{[['board', professional ? copy("Goal or industry (optional)") : copy("Board (optional)")], ['classLevel', professional ? copy("Level (optional)") : copy("Class / level (optional)")]].map(([key, label]) => <label className="text-sm" key={key}>{copy(label)}<input className="v-field mt-2" maxLength={100} value={selection[key]} onChange={e => setSelection({
                ...selection,
                [key]: e.target.value
              })} /></label>)}</div></details><div className="flex flex-wrap gap-3"><button className="v-button primary" disabled={busy}>{copy("Open my outline")}<ArrowRight size={16} /></button><button className="v-button" type="button" disabled={busy} onClick={() => openOutline(professional ? PROFESSIONAL_SAMPLE_SELECTION : SAMPLE_SELECTION)}>{copy(professional ? 'Try authored workplace sample' : 'Try authored learning sample')}</button></div></form><p className="v-muted mt-4">{copy(professional ? 'No capability yet? A numbered provisional outline keeps your place until sourced content is available. Teaching responses require a connected model.' : 'No subject yet? A numbered provisional outline keeps your place until sourced content is available. Teaching responses require a connected model.')}</p></details>}
  {!practice && syllabus && <><section aria-label={copy("Subject chapters")}>
    <h2 className="text-xl font-medium">{syllabus.subject}</h2>
    <p className="v-muted mt-2">{syllabus.status === 'provisional' ? copy("Provisional \xB7 The database has no matching outline yet. Your place and data-gap request are saved locally.") : syllabus.status === 'sample' ? copy('{count} authored sample activities · not official content coverage.', {
            count: syllabus.chapters.length
          }) : syllabus.provenance ? copy('Sourced from {provider} · version {version}.', {
            provider: syllabus.provenance.provider,
            version: syllabus.provenance.version
          }) : copy("Saved curriculum \xB7 source details unavailable.")}</p>
    {syllabus.status === 'official' && syllabus.contentLocale !== ctx.locale && <p className="v-notice mt-3">{copy('The saved outline is in {sourceLanguage}. Teaching content in {language} is shown only when it is actually available.', {
            sourceLanguage: languageNames[syllabus.contentLocale] || copy('Unavailable'),
            language: languageNames[ctx.locale]
          })}</p>}
    <div className="mt-4 flex flex-wrap gap-3">{syllabus.chapters.map(c => <button className="v-button" aria-pressed={chapter?.id === c.id} disabled={busy} key={c.id} onClick={() => openChapter(c)}><BookOpen size={17} />{c.title}</button>)}</div>
   </section>
   {chapter && <section className="v-card" aria-label={copy('{title} learning path', {
        title: chapter.title
      })}>
    <p className="v-home-eyebrow">{copy("Chapter learning path")}</p><h2 className="mt-2 text-lg font-medium">{chapter.title}</h2>
    <p className="v-muted mt-2">{copy('{started} of {total} concepts started. This counts activity, not mastery.', {
            started: startedConcepts,
            total: chapterConcepts.length
          })}</p>
    {nextConcept && <button className="v-button primary mt-5" disabled={busy} onClick={() => run(() => openConcept(nextConcept.id))}>{saved.some(activity => activity.conceptId === nextConcept.id) ? copy("Continue") : copy("Start")} {nextConcept.title}<ArrowRight size={16} /></button>}
    {chapter.status === 'provisional' && <form className="mt-5 flex flex-wrap gap-3" onSubmit={e => {
          e.preventDefault();
          run(async () => {
            await getContentRepository(ctx).renameProvisional(chapter.id, rename);
            const next = {
              ...chapter,
              title: rename
            };
            setChapter(next);
            setSyllabus({
              ...syllabus,
              chapters: syllabus.chapters.map(c => c.id === next.id ? next : c)
            });
          });
        }}><label className="min-w-0 flex-1 text-sm">{copy("Optional chapter name")}<input className="v-field mt-2" value={rename} maxLength={120} onChange={e => setRename(e.target.value)} /></label><button className="v-button self-end" disabled={busy}>{copy("Save name")}</button></form>}
    {topics.map(t => <div key={t.id} className="mt-6"><h3 className="text-sm font-medium">{t.title}</h3>{t.concepts.map(c => <div key={c.id}><div className="v-list-row"><div><p className="text-sm" lang={c.locale || undefined}>{c.title}</p><p className="v-muted">{copy(state.concepts.find(s => s.conceptId === c.id)?.stage || 'No evidence yet')} · {c.languageUnavailable ? copy('Teaching content not loaded in {language}', {
                    language: languageNames[ctx.locale]
                  }) : c.prerequisiteIds.length ? copy('{count} prerequisites', {
                    count: c.prerequisiteIds.length
                  }) : copy("Starting concept")}</p></div><button className="v-button" disabled={busy} onClick={() => run(() => openConcept(c.id))}>{saved.some(activity => activity.conceptId === c.id) ? copy("Continue") : copy('Open')}</button></div>{c.prerequisiteIds.length > 0 && <LearningPrerequisites compact ctx={ctx} conceptId={c.id} onOpen={id => run(() => openConcept(id))} />}</div>)}</div>)}
   </section>}
  </>}
  <Link className="v-button self-start" to={practice ? '/dashboard/practice?legacy=1' : '/dashboard/learn?legacy=1'}>{copy("Open previous saved topics and examples")}</Link>
 </div>;
}
