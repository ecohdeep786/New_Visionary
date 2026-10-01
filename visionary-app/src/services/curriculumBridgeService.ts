import type {RequestContext} from '../domain/workspace.ts';
import {workspaceIdentity} from './workspaceService.ts';
import {getSavedCurriculumGraphs,type ContentProvenance,type ContentSelection} from './contentRepository.ts';
import {getLearningWorkspace} from './learningPipelineService.ts';
import {getStageContinuity} from './stageTransitionService.ts';
import {getStudentState} from './mentorStateService.ts';

const sameSelection=(a:ContentSelection,b:ContentSelection)=>a.board===b.board&&a.classLevel===b.classLevel&&a.subject===b.subject;
const sameSource=(a:ContentProvenance,b:ContentProvenance)=>a.provider===b.provider&&a.sourceId===b.sourceId&&a.version===b.version;
/** A sourced plan only. Original units/evidence/dates are never rewritten by this read. */
export function getCurriculumBridge(ctx:RequestContext,transitionId:string){
 const detail=getStageContinuity(ctx,transitionId),identity=workspaceIdentity(ctx);
 const current=identity.person.learningContext;
 const canStart=detail.isLatest&&detail.state==='applied'&&(current?.stage||'')===(detail.to.stage||'')&&(current?.exam||'')===(detail.to.exam||'')&&current?.board===detail.to.board&&current?.classLevel===detail.to.classLevel&&JSON.stringify(current?.subjects||[])===JSON.stringify(detail.to.subjects||[]);
 const graphs=getSavedCurriculumGraphs(ctx).filter(graph=>graph.syllabus.status==='official'&&graph.syllabus.board===detail.to.board&&graph.syllabus.classLevel===detail.to.classLevel&&(detail.to.subjects||[]).includes(graph.syllabus.subject)&&graph.syllabus.contentLocale===ctx.locale);
 const units=getLearningWorkspace(ctx).units,states=new Map(getStudentState(ctx).concepts.map(item=>[item.conceptId,item]));
 const rows=units.map(unit=>{
  const matches=unit.sourceContext?graphs.flatMap(graph=>(graph.continuityMappings||[]).filter(mapping=>mapping.fromConceptId===unit.conceptId&&sameSelection(mapping.fromSelection,unit.sourceContext!.selection)&&sameSource(mapping.fromSource,unit.sourceContext!.provenance)).map(mapping=>({graph,mapping}))):[];
  const originalPath='/dashboard/learn?unit='+encodeURIComponent(unit.id);
  const currentGraph=unit.sourceContext?graphs.find(graph=>sameSelection(graph.syllabus,unit.sourceContext!.selection)&&sameSource(graph.syllabus.provenance!,unit.sourceContext!.provenance)&&graph.concepts.some(concept=>concept.id===unit.conceptId)):undefined;
  if(currentGraph)return{unitId:unit.id,title:unit.title,status:'current' as const,reason:'This activity already uses the target curriculum source version.',originalPath};
  if(matches.length!==1)return{unitId:unit.id,title:unit.title,status:'unresolved' as const,reason:!unit.sourceContext?'This older activity has no recorded source version. Its original work is retained.':matches.length>1?'More than one reviewed mapping matches. Review is needed before continuing.':'No reviewed mapping matches this activity’s exact source version.',originalPath};
  const {graph,mapping}=matches[0]!;
  const target=graph.concepts.find(item=>item.id===mapping.toConceptId);
  return{unitId:unit.id,title:unit.title,status:mapping.disposition,reason:mapping.reason,originalPath,reviewedAt:mapping.reviewedAt,reviewedBy:mapping.reviewedBy,target:target?{id:target.id,title:target.title}:undefined,source:graph.syllabus.provenance};
 });
 const equivalent=rows.filter(row=>row.status==='equivalent'&&row.target);
 const targets=graphs.flatMap(graph=>graph.concepts.map(concept=>({graph,concept}))).map(({graph,concept})=>({id:concept.id,title:concept.title,subject:graph.syllabus.subject,source:graph.syllabus.provenance,
  prerequisites:concept.prerequisiteIds.map(id=>{const prerequisite=graph.concepts.find(item=>item.id===id);const mapping=equivalent.find(row=>row.target?.id===id);const original=units.find(unit=>unit.id===mapping?.unitId);const recorded=original?states.get(original.conceptId):undefined;return{id,title:prerequisite?.title||'Prerequisite source unavailable',available:Boolean(prerequisite),priorReadiness:Boolean(recorded&&['Secure','Mastered'].includes(recorded.stage))};}),
  path:'/dashboard/learn?bridgeTransition='+encodeURIComponent(transitionId)+'&bridgeConcept='+encodeURIComponent(concept.id)}));
 return{canStart,rows,targets,missingSubjects:(detail.to.subjects||[]).filter(subject=>!graphs.some(graph=>graph.syllabus.subject===subject)),mappingCount:equivalent.length};
}
export function requireBridgeObjective(ctx:RequestContext,transitionId:string,conceptId:string){
 const plan=getCurriculumBridge(ctx,transitionId);
 const target=plan.targets.find(item=>item.id===conceptId);
 if(!plan.canStart||!target||plan.targets.filter(item=>item.id===conceptId).length!==1)throw Error('This bridge objective is unavailable for your active stage. Return Home and refresh the stage details.');
 return target;
}
