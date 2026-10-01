import {useState,useId} from 'react';
import {Link} from 'react-router-dom';
import {artifactRevision,snapshot} from '@/services/workspaceService';
import {submitClassworkProject,classworkCriterionText} from '@/services/classroomService';
import {classworkProjectText} from '@/lib/classworkProject';

export default function ClassworkProjectSubmission({ctx,artifacts,assignment,onSubmitted}){
 const [selected,setSelected]=useState('');const [preview,setPreview]=useState(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const id=useId();
 const available=(artifacts||[]).filter(item=>item.status==='completed'&&item.body.trim());
 const prepare=()=>{try{const artifact=snapshot(ctx).artifacts.find(item=>item.id===selected);if(!artifact)throw Error('Choose a completed project from this workspace.');const criteria=assignment.objective_snapshot?.criteria||[];if(criteria.length&&(artifact.conceptId!==assignment.objective_snapshot.conceptId||artifact.rubric?.sourceVersion!==assignment.objective_snapshot.provenance.version||artifact.rubric?.sourceProvider!==assignment.objective_snapshot.provenance.provider))throw Error('This project does not match the assigned objective and rubric source. Respond and review the assigned criteria in Learn.');setPreview({id:artifact.id,revision:artifactRevision(artifact),objectiveRevision:JSON.stringify(assignment.objective_snapshot||null),text:classworkProjectText(artifact)+classworkCriterionText(criteria,Object.fromEntries(criteria.map(item=>[item.id,artifact.rubric?.responses?.[item.id]])))});setError('');}catch(failure){setError(failure.message);setPreview(null);}};
 const submit=async()=>{if(!preview||busy)return;setBusy(true);setError('');try{const saved=await submitClassworkProject(ctx,{assignmentId:assignment.id,artifactId:preview.id,expectedRevision:preview.revision,expectedObjectiveRevision:preview.objectiveRevision});onSubmitted(saved);}catch(failure){setError(failure.message);}finally{setBusy(false);}};
 return <details className="rounded-2xl border border-[#dadce0] p-4 text-sm">
  <summary className="cursor-pointer font-medium">Submit a saved project copy</summary>
  <p className="v-muted mt-3">Choose a completed project in this workspace. The preview shows the exact document and self-review your class teacher will receive. Future edits stay separate. Private drafts and parent sharing settings are excluded.</p>
  {!available.length?<p className="mt-3">No completed projects in this workspace. <Link className="text-blue-700 underline" to="/dashboard/build">Open projects</Link></p>:<>
   <label htmlFor={id} className="mt-4 block font-medium">Completed project</label><select id={id} className="v-field mt-2" value={selected} disabled={busy} onChange={event=>{setSelected(event.target.value);setPreview(null);setError('');}}><option value="">Choose a project</option>{available.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select>
   <button className="v-button mt-3" disabled={!selected||busy} onClick={prepare}>Preview classroom copy</button>
   {preview&&<><div className="mt-4 max-h-80 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4" aria-label="Classroom project copy">{preview.text}</div><p className="v-muted mt-3">Submitting creates a fixed class response. Your teacher can return feedback or request a revision. Completion and self-review do not establish mastery.</p><button className="v-button primary mt-3" disabled={busy} onClick={submit}>{busy?'Submitting project…':assignment.revisionRequested?'Resubmit project copy':'Submit project copy'}</button></>}
  </>}
  {error&&<p role="alert" className="mt-3 text-[#b3261e]">{error}</p>}
 </details>;
}
