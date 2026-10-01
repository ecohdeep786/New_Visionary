import {appClient} from '../api/appClient.js';
import {bootstrapPerson,snapshot} from './workspaceService.ts';
import {submitClassworkResponses} from './classroomService.js';
import {assertLessonObjective} from './lessonObjective.ts';
export function classworkActivityRevision(assignment){return JSON.stringify([assignment.source_version,assignment.title,assignment.description,assignment.checks,assignment.points,assignment.objective_snapshot]);}
export async function getClassworkActivity(ctx,assignmentId){
 const account=await appClient.auth.me();if(account.id!==ctx.personId||!['student','professional'].includes(ctx.role))throw Error('Open your own learning workspace for this class activity.');
 snapshot(ctx);if(bootstrapPerson(account).active!==ctx.workspaceId)throw Error('Your workspace changed. Reopen this activity from your active classes.');
 const assignment=await appClient.entities.Assignment.get(assignmentId);if(!assignment)throw Error('This assignment is unavailable or your class connection changed.');
 if(assignment.objective_snapshot!==undefined)assertLessonObjective(assignment.objective_snapshot);
 const classroom=await appClient.entities.Classroom.get(assignment.class_id);if(!classroom)throw Error('Your class connection is no longer available.');
 const checks=assignment.checks||[];if(!Array.isArray(checks)||checks.length>10||checks.some(item=>!item||typeof item.id!=='string'||typeof item.prompt!=='string'||!item.prompt.trim())||new Set(checks.map(item=>item.id)).size!==checks.length)throw Error('The saved assignment questions are incomplete. Ask your teacher to review the source.');
 const submissions=await appClient.entities.Submission.filter({assignment_id:assignment.id,student_email:account.email});return {assignment,classroom,submission:submissions[0]||null};
}
export async function submitClassworkActivity(ctx,{assignmentId,expectedRevision,text,responses,selfReview}){
 const view=await getClassworkActivity(ctx,assignmentId);if(classworkActivityRevision(view.assignment)!==expectedRevision)throw Error('The assigned content changed. Your response remains here. Export it, then reopen the latest activity before submitting.');
 return submitClassworkResponses(ctx,{assignmentId,text,responses,selfReview});
}
