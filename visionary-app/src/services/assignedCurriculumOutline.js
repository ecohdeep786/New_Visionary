import {appClient} from '../api/appClient.js';
import {workspaceIdentity,bootstrapPerson} from './workspaceService.ts';
import {assertLessonObjective} from './lessonObjective.ts';
/** Read-only outline of actually visible assigned source copies. No full
 * library, unassigned objectives, responses, grade-as-mastery or answer keys. */
export async function getAssignedCurriculumOutline(ctx,classId){
 const account=await appClient.auth.me();workspaceIdentity(ctx);if(account.id!==ctx.personId||!['student','professional'].includes(ctx.role)||bootstrapPerson(account).active!==ctx.workspaceId)throw Error('Open your own learning workspace to review this class outline.');
 const classroom=await appClient.entities.Classroom.get(classId);const enrollments=await appClient.entities.Enrollment.filter({class_id:classId,student_email:account.email,status:'active'});if(!classroom||!enrollments.length)throw Error('This class outline is no longer connected to your learning workspace.');
 const assignments=await appClient.entities.Assignment.filter({class_id:classId});const submissions=await appClient.entities.Submission.filter({class_id:classId,student_email:account.email});
 const chapters=new Map(),unavailable=[],unmapped=[];
 const frequencies=new Map();for(const assignment of assignments)frequencies.set(assignment.id,(frequencies.get(assignment.id)||0)+1);
 for(const assignment of assignments){
  if(typeof assignment.id!=='string'||!assignment.id.trim()||typeof assignment.title!=='string'||frequencies.get(assignment.id)!==1){unavailable.push(assignment.id);continue;}
  const objective=assignment.objective_snapshot;if(!objective){unmapped.push({id:assignment.id,title:assignment.title,href:'/dashboard/learn?assignment='+encodeURIComponent(assignment.id)});continue;}
  try{assertLessonObjective(objective);}catch{unavailable.push(assignment.id);continue;}
  const source=objective.provenance,chapter=objective.sourceChapter;const key=JSON.stringify([objective.selection,source,objective.locale,objective.status,chapter?.id]);
  if(!chapters.has(key))chapters.set(key,{id:key,title:chapter?.title||'Assigned source objectives',sourceSection:chapter?.sourceSection,position:chapter?.position??Number.MAX_SAFE_INTEGER,selection:structuredClone(objective.selection),source:structuredClone(source),locale:objective.locale,status:objective.status,objectives:[]});
  const submission=submissions.find(row=>row.assignment_id===assignment.id);chapters.get(key).objectives.push({assignmentId:assignment.id,title:objective.title,assignmentTitle:assignment.title,position:objective.objectivePosition??Number.MAX_SAFE_INTEGER,state:submission?.status||'not-submitted',assignmentState:assignment.status||'published',prerequisites:structuredClone(objective.prerequisites||[]),href:'/dashboard/learn?assignment='+encodeURIComponent(assignment.id),askHref:'/dashboard/ask?assignment='+encodeURIComponent(assignment.id),practiceHref:'/dashboard/practice?assignment='+encodeURIComponent(assignment.id)});
 }
 workspaceIdentity(ctx);const latest=await appClient.auth.me();if(latest.id!==ctx.personId||bootstrapPerson(latest).active!==ctx.workspaceId)throw Error('Your workspace changed. Reopen this class outline.');const currentEnrollments=await appClient.entities.Enrollment.filter({class_id:classId,student_email:account.email,status:'active'});if(!currentEnrollments.length)throw Error('Class access changed while reading the outline. Reopen your classes.');if(ctx.signal?.aborted)throw new DOMException('Cancelled','AbortError');
 return {classId,className:classroom.name,chapters:[...chapters.values()].sort((a,b)=>a.position-b.position||a.title.localeCompare(b.title)).map(chapter=>({...chapter,objectives:chapter.objectives.sort((a,b)=>a.position-b.position||a.title.localeCompare(b.title))})),unmapped,unavailableCount:unavailable.length,assignedCount:assignments.length};
}
