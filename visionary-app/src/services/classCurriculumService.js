import {appClient} from '../api/appClient.js';
import {bootstrapPerson,workspaceIdentity,teacherOrganizationContent} from './workspaceService.ts';
import {assertCurriculumTemplate,curriculumObjectiveSnapshot} from './curriculumTemplate.ts';
import {assertCurriculumPublications,curriculumPublicationRevision} from '../lib/curriculumPublication.js';

async function classContext(ctx,classId,teacherOnly=false){
 const account=await appClient.auth.me();const {workspace}=workspaceIdentity(ctx);
 if(account.id!==ctx.personId||bootstrapPerson(account).active!==ctx.workspaceId||!(teacherOnly?['teacher']:['teacher','student','professional']).includes(ctx.role))throw Error('Open your active learning or teaching workspace to review this curriculum.');
 const classroom=await appClient.entities.Classroom.get(classId);
 if(!classroom||classroom.organization_email!==workspace.organizationId)throw Error('This class curriculum is unavailable in your active workspace.');
 if(ctx.role==='teacher'){
  if(![classroom.teacher_id,classroom.created_by_id].includes(account.id)&&![classroom.teacher_email,classroom.created_by].includes(account.email))throw Error('Only this class teacher can publish its curriculum.');
 }else{
  const enrolled=await appClient.entities.Enrollment.filter({class_id:classId,student_email:account.email,status:'active'});
  if(!enrolled.length)throw Error('This class curriculum is no longer connected to your learning workspace.');
 }
 if(ctx.signal?.aborted)throw new DOMException('Cancelled','AbortError');
 return classroom;
}

export function publicationFromDelivery(delivery){
 if(!delivery.curriculumTemplate)throw Error('Choose a delivered structured curriculum.');
 const template=delivery.curriculumTemplate;
 assertCurriculumTemplate(template,true);
 const row={id:crypto.randomUUID(),deliveryId:delivery.id,resourceId:delivery.resourceId,revision:delivery.revision,title:delivery.title,language:delivery.language,source:delivery.source,publishedAt:new Date().toISOString(),status:'published',stateHistory:[],chapters:template.chapters.map(chapter=>({id:chapter.id,title:chapter.title,sourceSection:chapter.sourceSection,objectives:chapter.objectives.map(objective=>curriculumObjectiveSnapshot(template,objective.id,delivery.language))}))};
 assertCurriculumPublications([row]);return row;
}

export async function changeClassCurriculumPublication(ctx,{classId,publicationId,expectedRevision,nextStatus}){
 if(!['published','withdrawn'].includes(nextStatus))throw Error('Choose an available curriculum action.');
 const classroom=await classContext(ctx,classId,true);const rows=classroom.curriculum_publications===undefined?[]:classroom.curriculum_publications;assertCurriculumPublications(rows);
 if(expectedRevision!==curriculumPublicationRevision(rows))throw Error('The published curriculum changed. Review the latest copies before changing availability.');
 const row=rows.find(copy=>copy.id===publicationId);if(!row)throw Error('This published copy is unavailable.');if(row.status===nextStatus)return row;
 const next={...row,status:nextStatus,stateHistory:[...row.stateHistory,{from:row.status,to:nextStatus,at:new Date().toISOString(),actor:ctx.personId}]};
 await classContext(ctx,classId,true);
 await appClient.entities.Classroom.update(classId,{curriculum_publications:rows.map(copy=>copy.id===row.id?next:copy)},{expectedCurriculumRevision:expectedRevision});return next;
}

/** Explicit publication of a fixed, reviewed delivery; never bulk-creates assignments or evidence. */
export async function publishClassCurriculum(ctx,{classId,deliveryId,expectedRevision}){
 let classroom=await classContext(ctx,classId,true);
 const delivery=teacherOrganizationContent(ctx).find(row=>row.id===deliveryId);
 if(!delivery)throw Error('This reviewed delivery is no longer available in your teaching workspace.');
 const rows=classroom.curriculum_publications===undefined?[]:classroom.curriculum_publications;assertCurriculumPublications(rows);
 const existing=rows.find(row=>row.deliveryId===deliveryId);if(existing)return existing;
 if(expectedRevision!==curriculumPublicationRevision(rows))throw Error('The published curriculum changed. Review the latest copies before publishing.');
 const publication=publicationFromDelivery(delivery);
 classroom=await classContext(ctx,classId,true);
 if(curriculumPublicationRevision(classroom.curriculum_publications)!==expectedRevision)throw Error('The published curriculum changed. Review the latest copies before publishing.');
 const latestDelivery=teacherOrganizationContent(ctx).find(row=>row.id===deliveryId);
 if(!latestDelivery||JSON.stringify(latestDelivery)!==JSON.stringify(delivery))throw Error('The reviewed source changed. Review this delivery again before publishing.');
 await appClient.entities.Classroom.update(classId,{curriculum_publications:[...rows,publication]},{expectedCurriculumRevision:expectedRevision});
 return publication;
}

export async function getClassCurriculum(ctx,classId){
 const classroom=await classContext(ctx,classId);const publications=classroom.curriculum_publications===undefined?[]:classroom.curriculum_publications;assertCurriculumPublications(publications);
 const assignments=await appClient.entities.Assignment.filter({class_id:classId});
 const copies=publications.filter(row=>ctx.role==='teacher'||row.status==='published').map(row=>({...structuredClone(row),chapters:row.chapters.map(chapter=>({...structuredClone(chapter),objectives:chapter.objectives.map(objective=>({objective:structuredClone(objective),assignments:assignments.filter(assignment=>JSON.stringify(assignment.objective_snapshot)===JSON.stringify(objective)).map(assignment=>({id:assignment.id,title:assignment.title,href:'/dashboard/learn?assignment='+encodeURIComponent(assignment.id)}))}))}))}));
 const latest=await classContext(ctx,classId);
 if(curriculumPublicationRevision(latest.curriculum_publications)!==curriculumPublicationRevision(publications))throw Error('Published curriculum changed while reading. Retry to review the current available copies.');
 return {className:classroom.name,revision:ctx.role==='teacher'?curriculumPublicationRevision(publications):undefined,publications:copies};
}
