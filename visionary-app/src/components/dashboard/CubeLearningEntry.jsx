import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, ArrowRight } from 'lucide-react';
import WorkspaceIntro from './WorkspaceIntro';
import { useWorkspace } from '@/hooks/useWorkspace';
import { getLearningWorkspace, openCubeLearningSample } from '@/services/learningPipelineService';

export default function CubeLearningEntry({ from = 'explore' }) {
 const { ctx, error: workspaceError } = useWorkspace();
 const navigate = useNavigate();
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 if (workspaceError || !ctx) return <div className="v-page" role={workspaceError ? 'alert' : 'status'}>{workspaceError || 'Opening your learning workspace…'}</div>;
 let active;
 try { active = getLearningWorkspace(ctx).units.find(unit => unit.conceptId === 'sample:cube:concept' && !unit.classId && unit.stage !== 'completed'); }
 catch (problem) { return <div className="v-page" role="alert">{problem.message}</div>; }
 const practice = from === 'practice';
 async function open() {
  if (busy) return;
  setBusy(true); setError('');
  try {
   const unit = await openCubeLearningSample(ctx);
   navigate(`/dashboard/${practice ? 'practice' : 'learn'}?unit=${encodeURIComponent(unit.id)}`);
  } catch (problem) { setError(problem.message || 'This activity could not be opened. Please retry.'); setBusy(false); }
 }
 return <div className="v-page">
  <WorkspaceIntro eyebrow="Authored mathematics sample" title={practice ? 'Practice cube volume in your lesson' : 'Explore cube volume in your lesson'} description="The cube model, explanation, questions, attempts and project stay with one saved concept. This sample is not official curriculum coverage." icon={Box}/>
  {error && <p className="v-notice v-error" role="alert">{error} Your earlier saved work remains available.</p>}
  <section className="v-card"><h2 className="text-lg font-medium">{active ? 'Continue the saved cube activity' : 'Start the cube activity'}</h2><p className="v-muted mt-3">Change the model’s side length and rotation, read its description, then check understanding one question at a time. Exploring the model alone adds no assessment evidence.</p>
   {active && <p className="v-muted mt-2">Saved step: {active.stage === 'explain' ? 'Understand' : active.stage === 'check' ? 'Check' : active.stage === 'practice' ? 'Practice' : 'Build'}.</p>}
   {ctx.role === 'student' ? <button className="v-button primary mt-5" disabled={busy} onClick={open}>{busy ? 'Opening…' : active ? 'Continue saved activity' : 'Open authored activity'}<ArrowRight size={16}/></button> : <p className="v-notice mt-5">This authored school activity is available in a student workspace.</p>}
  </section>
  <section className="v-card"><h2 className="text-base font-medium">Previous local activity</h2><p className="v-muted mt-2">Earlier lab and three-question results are still available in their original view. They are separate from the current concept’s assessment record.</p><Link className="v-button mt-4" to={`/dashboard/${practice ? 'practice' : 'explore'}?legacy=1`}>Open previous {practice ? 'practice example' : 'cube lab'}</Link></section>
 </div>;
}
