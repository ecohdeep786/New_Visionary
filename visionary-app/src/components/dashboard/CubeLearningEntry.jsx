import { legacyLearningCopy } from '@/lib/legacyLearningCopy';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, ArrowRight } from 'lucide-react';
import WorkspaceIntro from './WorkspaceIntro';
import { useWorkspace } from '@/hooks/useWorkspace';
import { getLearningWorkspace, openCubeLearningSample } from '@/services/learningPipelineService';
export default function CubeLearningEntry({
  from = 'explore'
}) {
  const {
    ctx,
    data,
    error: workspaceError
  } = useWorkspace();
  const locale = data?.preferences.interfaceLocale || 'en';
  const copy = legacyLearningCopy(locale);
  const request=useRef(null);useEffect(()=>()=>request.current?.abort(),[ctx?.personId,ctx?.workspaceId,from]);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');const [,setRetry]=useState(0);
  if (workspaceError || !ctx) return <div className="v-page" role={workspaceError ? 'alert' : 'status'} lang={locale}>{workspaceError || copy("Opening your learning workspace\u2026")}</div>;
  let active;
  try {
    active = getLearningWorkspace(ctx).units.find(unit => unit.conceptId === 'sample:cube:concept' && !unit.classId && unit.stage !== 'completed');
  } catch (problem) {
    return <div className="v-page" lang={locale}><h1 className="v-title">{copy("Saved learning unavailable")}</h1><p role="alert" lang="en">{problem.message}</p><button className="v-button mt-4" onClick={()=>setRetry(value=>value+1)}>{copy("Retry saved learning")}</button></div>;
  }
  const practice = from === 'practice';
  async function open() {
    if (busy) return;
    const controller=new AbortController();request.current=controller;setBusy(true);
    setError('');
    try {
      const unit = await openCubeLearningSample({...ctx,signal:controller.signal});if(controller.signal.aborted)return;
      navigate(`/dashboard/${practice ? 'practice' : 'learn'}?unit=${encodeURIComponent(unit.id)}`);
    } catch (problem) {
      if(controller.signal.aborted)return;setError(problem.message || 'This activity could not be opened. Please retry.');
      setBusy(false);
    }
  }
  return <div className="v-page" lang={locale}>
  <WorkspaceIntro eyebrow={copy("Authored mathematics sample")} title={practice ? copy("Practice cube volume in your lesson") : copy("Explore cube volume in your lesson")} description={copy("The cube model, explanation, questions, attempts and project stay with one saved concept. This sample is not official curriculum coverage.")} icon={Box} />
  {error && <p className="v-notice v-error" role="alert">{error} {copy("Your earlier saved work remains available.")}</p>}
  <section className="v-card"><h2 className="text-lg font-medium">{active ? copy("Continue the saved cube activity") : copy("Start the cube activity")}</h2><p className="v-muted mt-3">{copy("Change the model\u2019s side length and rotation, read its description, then check understanding one question at a time. Exploring the model alone adds no assessment evidence.")}</p>
   {active && <p className="v-muted mt-2">{copy("Saved step:")} {active.stage === 'explain' ? copy("Understand") : active.stage === 'check' ? copy("Check") : active.stage === 'practice' ? copy("Practice") : copy("Build")}.</p>}
   {ctx.role === 'student' ? <button className="v-button primary mt-5" disabled={busy} onClick={open}>{busy ? copy('Opening…') : active ? copy("Continue saved activity") : copy("Open authored activity")}<ArrowRight size={16} /></button> : <p className="v-notice mt-5">{copy("This authored school activity is available in a student workspace.")}</p>}
  </section>
  <section className="v-card"><h2 className="text-base font-medium">{copy("Previous local activity")}</h2><p className="v-muted mt-2">{copy("Earlier lab and three-question results are still available in their original view. They are separate from the current concept\u2019s assessment record.")}</p><Link className="v-button mt-4" to={`/dashboard/${practice ? 'practice' : 'explore'}?legacy=1`}>{copy(practice ? 'Open previous practice example' : 'Open previous cube lab')}</Link></section>
 </div>;
}
