import {appClient} from '../api/appClient.js';
import {bootstrapPerson,snapshot} from './workspaceService.ts';
import {submitClassworkResponses} from './classroomService.js';
import {assertLessonObjective} from './lessonObjective.ts';
import {classworkActivityRevision} from '../lib/classworkSource.js';
export {classworkActivityRevision} from '../lib/classworkSource.js';
export async function getClassworkActivity(ctx,assignmentId){
 if(ctx.signal?.aborted)throw new DOMException('Cancelled','AbortError');
 const account=await appClient.auth.me();if(account.id!==ctx.personId||!['student','professional'].includes(ctx.role))throw Error('Open your own learning workspace for this class activity.');
 snapshot(ctx);if(bootstrapPerson(account).active!==ctx.workspaceId)throw Error('Your workspace changed. Reopen this activity from your active classes.');
 const assignment=await appClient.entities.Assignment.get(assignmentId);if(!assignment)throw Error('This assignment is unavailable or your class connection changed.');
 if(assignment.objective_snapshot!==undefined)assertLessonObjective(assignment.objective_snapshot);
 const classroom=await appClient.entities.Classroom.get(assignment.class_id);if(!classroom)throw Error('Your class connection is no longer available.');
 const checks=assignment.checks||[];if(!Array.isArray(checks)||checks.length>10||checks.some(item=>!item||typeof item.id!=='string'||typeof item.prompt!=='string'||!item.prompt.trim())||new Set(checks.map(item=>item.id)).size!==checks.length)throw Error('The saved assignment questions are incomplete. Ask your teacher to review the source.');
 const submissions=await appClient.entities.Submission.filter({assignment_id:assignment.id,student_email:account.email});
 // Permissions and fixed source can change while the asynchronous reads run.
 // Do not return a previously visible source after access has been revoked.
 const currentAssignment=await appClient.entities.Assignment.get(assignmentId);
 const currentClassroom=await appClient.entities.Classroom.get(assignment.class_id);
 const enrollments=await appClient.entities.Enrollment.filter({class_id:assignment.class_id,student_email:account.email,status:'active'});
 const latest=await appClient.auth.me();snapshot(ctx);
 if(latest.id!==ctx.personId||bootstrapPerson(latest).active!==ctx.workspaceId)throw Error('Your workspace changed. Reopen this activity from your active classes.');
 if(!currentAssignment||!currentClassroom||!enrollments.length)throw Error('This assignment is unavailable or your class connection changed.');
 if(currentAssignment.class_id!==assignment.class_id||classworkActivityRevision(currentAssignment)!==classworkActivityRevision(assignment))throw Error('The assigned content changed while opening this activity. Reopen the latest source.');
 if(ctx.signal?.aborted)throw new DOMException('Cancelled','AbortError');
 return {assignment:currentAssignment,classroom:currentClassroom,submission:submissions[0]||null};
}
export async function submitClassworkActivity(ctx,{assignmentId,expectedRevision,text,responses,selfReview}){
 const view=await getClassworkActivity(ctx,assignmentId);if(classworkActivityRevision(view.assignment)!==expectedRevision)throw Error('The assigned content changed. Your response remains here. Export it, then reopen the latest activity before submitting.');
 return submitClassworkResponses(ctx,{assignmentId,expectedRevision,text,responses,selfReview});
}
