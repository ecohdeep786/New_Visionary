import {getClassworkActivity,classworkActivityRevision} from './classworkPlayerService.js';
import {workspaceIdentity} from './workspaceService.ts';
import {assertCurriculumTemplate,curriculumObjectiveSnapshot} from './curriculumTemplate.ts';
/** Private rehearsal source. Return keys only to the local grading service;
 * learner view models must continue projecting prompt/options and a digest. */
function assignedQuestions(ctx,view){
 workspaceIdentity(ctx);
 const source=view.assignment.source_provenance;const unavailable=()=>{throw Error('Practice for the exact assigned reviewed curriculum is unavailable. The assigned copy and private study are retained.');};
 if(view.assignment.objective_snapshot?.status!=='reviewed'||!source?.curriculumObjectiveId||!source.organizationEmail||source.organizationEmail!==view.classroom.organization_email)return unavailable();
 let db;try{db=JSON.parse(localStorage.getItem('visionary_workspace_v2')||'null');if(db?.version!==2||!Array.isArray(db.people)||!Array.isArray(db.workspaces)||!db.data)throw Error();}catch{return unavailable();}
 const owner=db.people.find(person=>person.email===source.organizationEmail);const space=db.workspaces.find(row=>row.personId===owner?.id&&row.role==='organization'&&!row.organizationId);const resources=space&&db.data[space.id]?.resources;if(!Array.isArray(resources))return unavailable();const resource=resources.find(row=>row.id===source.resourceId);if(!Array.isArray(resource?.contentReview?.deliveries))return unavailable();const delivery=resource.contentReview.deliveries.find(row=>row.id===source.deliveryId&&row.resourceId===source.resourceId&&row.revision===source.revision&&row.teacherEmail===view.classroom.teacher_email);
 if(!delivery?.curriculumTemplate||delivery.language!==view.assignment.objective_snapshot.locale)return unavailable();
 assertCurriculumTemplate(delivery.curriculumTemplate,true);const expected=curriculumObjectiveSnapshot(delivery.curriculumTemplate,source.curriculumObjectiveId,delivery.language);
 // Optional chapter labels were introduced after the first reviewed copies.
 // Preserve those copies; compare every field they actually pinned without
 // filling new metadata into the assignment or assuming another source.
 if(!Object.hasOwn(view.assignment.objective_snapshot,'sourceChapter'))delete expected.sourceChapter;
 if(!Object.hasOwn(view.assignment.objective_snapshot,'objectivePosition'))delete expected.objectivePosition;
 if(JSON.stringify(expected)!==JSON.stringify(view.assignment.objective_snapshot))return unavailable();
 const objective=delivery.curriculumTemplate.chapters.flatMap(chapter=>chapter.objectives).find(row=>row.id===source.curriculumObjectiveId);const questions=objective?.practice||[];if(!questions.length)throw Error('No authored practice questions were included in this assigned revision. No questions have been generated.');
 return structuredClone(questions);
}
export async function getAssignedCurriculumPracticeSource(ctx,assignmentId){
 const view=await getClassworkActivity(ctx,assignmentId),questions=assignedQuestions(ctx,view);
 const latest=await getClassworkActivity(ctx,assignmentId);workspaceIdentity(ctx);if(classworkActivityRevision(latest.assignment)!==classworkActivityRevision(view.assignment))throw Error('The assigned source changed while opening practice. Reopen the activity.');if(ctx.signal?.aborted)throw new DOMException('Cancelled','AbortError');
 // The delivery can change during the final authorization read. Capture it
 // again synchronously before returning; never return the earlier bank.
 const currentQuestions=assignedQuestions(ctx,latest);
 if(JSON.stringify(currentQuestions)!==JSON.stringify(questions))throw Error('The assigned practice source changed. Reopen the latest activity; your saved study is retained.');
 return {activity:latest,questions:currentQuestions};
}
