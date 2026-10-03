import { guideCopy } from '@/lib/guideCopy';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Maximize2, MessageCircle, RotateCcw, CheckCircle2 } from 'lucide-react';
import { getJourney } from '@/services/journeys';
import { answerQuestion, updateSession, saveArtifact, mastery, beginReview, snapshot } from '@/services/workspaceService';
const stages = ['diagnosing', 'explaining', 'exploring', 'checking', 'practicing', 'building', 'reflecting', 'completed'];
export default function GuideActivity({
  ctx,
  session,
  onAsk,
  onFocus
}) {
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [answer, setAnswer] = useState('');
  const [savedProject, setSavedProject] = useState(() => snapshot(ctx).artifacts.some(a => a.journeyId === session.journeyId));
  const preferences = snapshot(ctx).preferences;
  const locale = preferences.interfaceLocale || 'en';
  const copy = guideCopy(locale);
  const journey = getJourney(session.journeyId, session.locale);
  const question = journey.questions[session.position];
  const stage = session.stage;
  const stageIndex = stages.indexOf(stage);
  const isQuestion = stage === 'checking' || stage === 'practicing';
  function update(patch) {
    try {
      updateSession(ctx, session.id, patch);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }
  function advance() {
    setFeedback(null);
    setAnswer('');
    if (stage === 'checking') {
      update({
        stage: 'practicing',
        position: 0
      });
      return;
    }
    if (stage === 'practicing' && session.position < journey.questions.length - 1) {
      update({
        position: session.position + 1
      });
      return;
    }
    update({
      stage: stages[Math.min(stageIndex + 1, stages.length - 1)],
      position: 0
    });
  }
  function respond() {
    try {
      const result = answerQuestion(ctx, session.id, answer);
      setFeedback(result);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    setAnswer(session.answers[`${session.stage}:${session.position}:${session.reviewRound || 0}`] || '');
    setFeedback(null);
  }, [session.id, session.stage, session.position, session.reviewRound]);
  const stageLabels = {
    diagnosing: 'Start with what you know',
    explaining: 'Understand the idea',
    exploring: 'Explore it yourself',
    checking: 'Check your understanding',
    practicing: 'Make it stick',
    building: 'Put it to work',
    reflecting: 'Reflect and continue',
    completed: 'A useful step forward',
    remediating: 'Try a smaller step'
  };
  return <div className="flex min-w-0 flex-col gap-5">
  <div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-[#5f6368]">{copy("Learning activity \xB7 Demo content")}</span><button className="v-button !px-3" aria-label={copy("Toggle activity focus")} onClick={onFocus}><Maximize2 size={18} /></button></div>
  <div><h2 className="v-title" lang={session.locale}>{journey.title}</h2><p className="v-muted mt-2" lang={session.locale}>{journey.objective}</p></div>
  <div className="flex flex-wrap items-center gap-3"><label className="text-xs text-[#5f6368]">{copy("Teaching language")}<select aria-label={copy("Activity language")} className="v-field mt-1" value={session.locale} onChange={e => update({
          locale: e.target.value
        })}><option value="en">English</option><option value="hi">हिन्दी</option><option value="bn">বাংলা</option></select></label><label className="text-xs text-[#5f6368]">{copy("Representation")}<select aria-label={copy("Representation")} className="v-field mt-1" value={session.representation} onChange={e => update({
          representation: e.target.value
        })}><option value="interactive">{copy("Interactive")}</option><option value="text">Text alternative</option></select></label></div>
  <ol aria-label={copy("Learning stages")} className="flex flex-wrap gap-2">{stages.map((s, i) => <li key={s} aria-current={s === stage ? 'step' : undefined} className={`rounded-full px-2.5 py-1 text-xs ${s === stage ? 'bg-[#3367d6] text-white' : 'bg-white text-[#5f6368]'}`}>{i + 1}. {s === 'diagnosing' ? copy("Start") : copy(s[0].toUpperCase() + s.slice(1))}</li>)}</ol>
  {session.interrupted && <div className="v-notice"><p>{copy("Your activity is paused while you ask. Your position and controls are saved.")}</p><button className="v-button mt-2" onClick={() => update({
        interrupted: false
      })}>{copy("That makes sense \xB7 Resume")}</button></div>}
  <section className="v-card" lang={locale}><h3 className="mb-4 text-lg font-medium" lang={locale}>{copy(stageLabels[stage])}</h3>
   {stage === 'diagnosing' && <><p className="v-muted" lang={session.locale}>{journey.objective}</p><p className="mt-4 text-sm" lang={locale}>{copy("Think about an example you already know. You can begin without a diagnostic score.")}</p><button onClick={advance} className="v-button primary mt-5">{copy("Start exploring")}<ArrowRight size={16} /></button></>}
   {(stage === 'explaining' || stage === 'remediating') && <><p className="whitespace-pre-wrap text-base leading-8" lang={session.locale}>{journey.explanation}</p>{preferences.bilingual && session.locale !== 'en' && <details className="mt-4 text-sm" lang={locale}><summary className="cursor-pointer">{copy("English source explanation")}</summary><p className="mt-3 leading-7">{getJourney(session.journeyId, 'en').explanation}</p></details>}<p className="v-muted mt-5" lang={locale}>{copy("Read at your own pace. This text is also the accessible alternative to the visual activity.")}</p>{stage === 'remediating' && <button className="v-button mt-4" onClick={() => update({
          stage: 'checking'
        })}>{copy("Try the check again")}</button>}</>}
   {stage === 'exploring' && <><p className="v-muted mb-5" lang={session.locale}>{journey.exploration}</p>{session.representation === 'text' ? <p className="text-base leading-8" lang={session.locale}>{journey.explanation}</p> : session.journeyId === 'cube' ? <>
    <div className="cube-stage" role="img" aria-label={copy("Cube with side {size}; volume {volume} cubic units", {
            size: session.canvas.size,
            volume: session.canvas.size ** 3
          })}><div className="learning-cube" aria-hidden="true" style={{
              transform: `rotateX(-18deg) rotateY(${session.canvas.rotation}deg) scale(${.6 + session.canvas.size / 10})`
            }}>{['translateZ(55px)', 'rotateY(180deg) translateZ(55px)', 'rotateY(90deg) translateZ(55px)', 'rotateY(-90deg) translateZ(55px)', 'rotateX(90deg) translateZ(55px)', 'rotateX(-90deg) translateZ(55px)'].map((transform, i) => <span key={transform} style={{
                transform
              }}>{i === 0 ? session.canvas.size : ''}</span>)}</div></div>
    <p className="my-4 text-center text-lg tabular-nums">V = {session.canvas.size} × {session.canvas.size} × {session.canvas.size} = <strong>{session.canvas.size ** 3}</strong></p><label className="block text-sm">{copy('Side length: {size}', {
              size: session.canvas.size
            })}<input aria-label={copy("Cube side length")} className="mt-3 w-full" type="range" min="1" max="8" value={session.canvas.size} onChange={e => update({
              canvas: {
                ...session.canvas,
                size: Number(e.target.value)
              }
            })} /></label><label className="mt-4 block text-sm">{copy("Rotation")}<input aria-label={copy("Cube rotation")} className="mt-3 w-full" type="range" min="0" max="360" value={session.canvas.rotation} onChange={e => update({
              canvas: {
                ...session.canvas,
                rotation: Number(e.target.value)
              }
            })} /></label><button className="v-button mt-4" onClick={() => update({
            canvas: {
              size: 3,
              rotation: 25
            }
          })}><RotateCcw size={16} />{copy("Reset model")}</button>
   </> : session.journeyId === 'fractions' ? <><div aria-label={copy("{count} eighths selected", {
            count: session.canvas.size
          })} className="my-8 flex h-16 overflow-hidden rounded-lg border border-[#3367d6]">{Array.from({
              length: 8
            }, (_, i) => <div key={i} className={`flex-1 border-r border-[#3367d6] ${i < session.canvas.size ? 'bg-[#e8f0fd]' : 'bg-white'}`} />)}</div><label className="text-sm">{session.canvas.size}/8<input aria-label={copy("Selected eighths")} className="mt-4 w-full" type="range" min="0" max="8" value={session.canvas.size} onChange={e => update({
              canvas: {
                ...session.canvas,
                size: Number(e.target.value)
              }
            })} /></label><div className="mt-2 flex justify-between text-xs"><span>0</span><span>1/2 = 4/8</span><span>1</span></div></> : <table className="w-full text-left text-sm"><caption className="mb-3 text-left">{copy("Fictional three-week sample")}</caption><thead><tr><th className="py-3">{copy("Week")}</th><th>{copy("Completed tasks")}</th></tr></thead><tbody>{[20, 30, 25].map((n, i) => <tr key={i} className="border-t"><td className="py-3">{i + 1}</td><td>{n}</td></tr>)}</tbody></table>}</>}
   {isQuestion && question && <><p className="mb-3 text-xs text-[#5f6368]">{session.position + 1} / {journey.questions.length}</p><fieldset><legend className="mb-4 text-base font-medium leading-7" lang={session.locale}>{question.prompt}</legend><div className="space-y-3">{question.options.map((option, i) => <label key={option} className="flex min-h-12 items-center gap-3 rounded-xl border p-3 text-sm"><input type="radio" name="activity-answer" value={i} checked={answer === String(i)} onChange={e => {
                setAnswer(e.target.value);
                setFeedback(null);
              }} />{option}</label>)}</div></fieldset><button className="v-button primary mt-5" disabled={!answer} onClick={respond}>{copy("Check my answer")}</button>{feedback && <div className="v-notice mt-4" role="status"><p className="font-medium" lang={locale}>{feedback.correct ? copy("That\u2019s right.") : copy("Let\u2019s look at the reasoning.")}</p><p className="mt-2">{feedback.explanation}</p><button className="v-button mt-3" onClick={advance}>{feedback.correct ? copy("Continue") : copy("Continue with this explanation")}</button>{!feedback.correct && <button className="v-button ml-2 mt-3" onClick={() => {
            setFeedback(null);
            update({
              stage: 'remediating'
            });
          }}>{copy("Review the idea")}</button>}</div>}</>}
   {stage === 'building' && <><h4 className="text-base font-medium" lang={session.locale}>{journey.project}</h4><p className="v-muted mt-3" lang={session.locale}>{journey.projectBrief}</p><button className="v-button primary mt-5" onClick={() => {
          try {
            saveArtifact(ctx, {
              title: journey.project,
              body: journey.projectBrief,
              journeyId: journey.id
            });
            setSavedProject(true);
          } catch (e) {
            setError(e.message);
          }
        }} disabled={savedProject}>{savedProject ? copy("Project saved") : copy("Create project draft")}</button>{savedProject && <Link className="v-button ml-2 mt-3" to="/dashboard/build">{copy("Open Build")}</Link>}</>}
   {stage === 'reflecting' && <><label className="text-sm" lang={locale}>{copy("How confident do you feel? (Your own assessment)")}<select aria-label={copy("How confident do you feel? (Your own assessment)")} className="v-field mt-3" value={session.confidence ?? ''} onChange={e => update({
            confidence: Number(e.target.value)
          })}><option value="" disabled>{copy("Choose or skip")}</option><option value="25">{copy("I need more support")}</option><option value="50">{copy("I\u2019m beginning to understand")}</option><option value="75">{copy("I can explain it")}</option><option value="100">{copy("I can apply it independently")}</option></select></label><p className="v-muted mt-4" lang={locale}>{copy("This self-report is separate from your answers. Review this idea again tomorrow to check what you remember.")}</p></>}
   {stage === 'completed' && <><CheckCircle2 className="mb-4 text-[#137333]" /><p className="text-base" lang={locale}>{copy("Activity completed. Evidence stage:")}<strong>{mastery(session.evidence, true)}</strong>.</p><p className="v-muted mt-3" lang={locale}>{copy("Completing a lesson is not the same as mastery. Varied application and delayed recall build stronger evidence.")}</p><Link className="v-button mt-5" to="/dashboard/progress">{copy("View evidence")}</Link><button className="v-button ml-2 mt-3" onClick={() => {
          try {
            beginReview(ctx, session.id);
          } catch (e) {
            setError(e.message);
          }
        }}>{copy("Start a new review")}</button></>}
  </section>
  {!isQuestion && !['diagnosing', 'completed', 'remediating'].includes(stage) && <div className="flex justify-between gap-3"><button className="v-button" onClick={() => update({
        stage: stages[Math.max(0, stageIndex - 1)]
      })}><ArrowLeft size={16} />{copy("Back")}</button><button className="v-button primary" onClick={advance}>{copy("Continue")}<ArrowRight size={16} /></button></div>}
  <label className="text-sm">{copy("Your private notes")}<textarea className="v-field mt-2" rows={3} value={session.notes} onChange={e => update({
        notes: e.target.value
      })} placeholder={copy("Keep a thought, example, or question\u2026")} /></label>
  <div className="flex flex-wrap items-center justify-between gap-3"><button className="v-button" onClick={() => {
        update({
          interrupted: true
        });
        onAsk();
      }}><MessageCircle size={16} />{copy("Ask Visionary")}</button><span className="text-xs text-[#5f6368]">{copy("Saved on this device")}</span></div>{error && <p role="alert" className="v-notice v-error" lang="en">{error}</p>}
 </div>;
}
