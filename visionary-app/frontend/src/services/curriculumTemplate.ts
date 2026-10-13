import type {CurriculumTemplate} from '../domain/curriculumTemplate.ts';
import type {LessonObjectiveSnapshot} from '../domain/lessonObjective.ts';
import type {Locale} from '../domain/workspace.ts';
import {assertLessonObjective} from './lessonObjective.ts';
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
const keys=(value:Record<string,unknown>,allowed:string[])=>Object.keys(value).every(key=>allowed.includes(key));
const text=(value:unknown,max:number,complete:boolean):value is string=>typeof value==='string'&&value.length<=max&&(!complete||Boolean(value.trim()));
/** Validate structure on every save and full source/teaching completeness at review. */
export function assertCurriculumTemplate(value:unknown,complete=false):asserts value is CurriculumTemplate {
 const fail=()=>{throw Error('The curriculum structure is incomplete or inconsistent. Check source fields, chapters, objectives, criteria and prerequisites. Original saved content is retained.');};
 if(!record(value)||!keys(value,['schemaVersion','selection','provenance','chapters'])||value.schemaVersion!==1)return fail();
 for(const [field,fields] of [['selection',['board','classLevel','subject']],['provenance',['provider','sourceId','version']]] as const){const row=value[field];if(!record(row)||!keys(row,[...fields])||fields.some(key=>!text(row[key],200,complete)))return fail();}
 if(!Array.isArray(value.chapters)||value.chapters.length>30||(complete&&!value.chapters.length))return fail();
 const objectives:Record<string,unknown>[]=[];const ids=new Set<string>();
 for(const chapter of value.chapters){
  if(!record(chapter)||!keys(chapter,['id','title','sourceSection','objectives'])||!text(chapter.id,100,true)||ids.has(chapter.id)||!text(chapter.title,200,complete)||!text(chapter.sourceSection,500,complete)||!Array.isArray(chapter.objectives)||chapter.objectives.length>30||(complete&&!chapter.objectives.length))return fail();ids.add(chapter.id);
  for(const objective of chapter.objectives){
   if(!record(objective)||!keys(objective,['id','title','explanation','prerequisiteIds','representations','criteria','practice'])||!text(objective.id,100,true)||ids.has(objective.id)||!text(objective.title,200,complete)||!text(objective.explanation,10000,complete)||!Array.isArray(objective.prerequisiteIds)||objective.prerequisiteIds.length>30||objective.prerequisiteIds.some(id=>!text(id,100,true))||new Set(objective.prerequisiteIds).size!==objective.prerequisiteIds.length||!Array.isArray(objective.representations)||!Array.isArray(objective.criteria)||objective.criteria.length>20||(complete&&!objective.criteria.length))return fail();
   ids.add(objective.id);objectives.push(objective);
   // Reuse the assignment validator for representations; incomplete criterion
   // labels remain valid drafts and are checked before submission.
   if(objective.representations.some(view=>!record(view)||!text(view.alternative,10000,complete)))return fail();
   try{assertLessonObjective({conceptId:objective.id,title:objective.title.trim()||'Draft',status:'reviewed',locale:'en',selection:{board:'Draft',classLevel:'Draft',subject:'Draft'},provenance:{provider:'Draft',sourceId:'Draft',version:'Draft'},explanation:objective.explanation.trim()||'Draft',representations:objective.representations.map(view=>({...view,alternative:complete?view.alternative:view.alternative.trim()||'Draft'}))});}catch{return fail();}
   const criterionIds=new Set<string>();for(const criterion of objective.criteria){if(!record(criterion)||!keys(criterion,['id','label','prompt'])||!text(criterion.id,100,true)||criterionIds.has(criterion.id)||!text(criterion.label,200,complete)||!text(criterion.prompt,2000,complete))return fail();criterionIds.add(criterion.id);}
   if(objective.practice!==undefined){
    if(!Array.isArray(objective.practice)||objective.practice.length>20)return fail();const questionIds=new Set<string>();
    for(const question of objective.practice){if(!record(question)||!keys(question,['id','prompt','options','answerIndex'])||!text(question.id,100,true)||questionIds.has(question.id)||!text(question.prompt,2000,complete)||!Array.isArray(question.options)||question.options.length<2||question.options.length>6||question.options.some(option=>!text(option,1000,complete))||(complete&&new Set(question.options.map(option=>option.trim().toLowerCase())).size!==question.options.length)||typeof question.answerIndex!=='number'||!Number.isInteger(question.answerIndex)||question.answerIndex<(complete?0:-1)||question.answerIndex>=question.options.length)return fail();questionIds.add(question.id);}
   }
  }
 }
 if(objectives.length>200)return fail();
 const byId=new Map(objectives.map(row=>[row.id as string,row]));const done=new Set<string>(),visiting=new Set<string>();
 function visit(id:string){if(visiting.has(id))return fail();if(done.has(id))return;const row=byId.get(id);if(!row)return fail();visiting.add(id);for(const prerequisite of row.prerequisiteIds as string[])visit(prerequisite);visiting.delete(id);done.add(id);}
 for(const row of objectives)visit(row.id as string);
}
export function curriculumObjectiveSnapshot(template:CurriculumTemplate,objectiveId:string,locale:Locale):LessonObjectiveSnapshot {
 assertCurriculumTemplate(template,true);const chapter=template.chapters.find(row=>row.objectives.some(objective=>objective.id===objectiveId));const objective=chapter?.objectives.find(row=>row.id===objectiveId);if(!objective||!chapter)throw Error('Choose an objective from this delivered curriculum revision.');
 const all=template.chapters.flatMap(row=>row.objectives);
 const snapshot:LessonObjectiveSnapshot={conceptId:objective.id,title:objective.title,status:'reviewed',locale,selection:structuredClone(template.selection),provenance:{...template.provenance,sourceId:template.provenance.sourceId+' · '+chapter.sourceSection},sourceChapter:{id:chapter.id,title:chapter.title,sourceSection:chapter.sourceSection,position:template.chapters.indexOf(chapter)},objectivePosition:chapter.objectives.indexOf(objective),explanation:objective.explanation,representations:structuredClone(objective.representations),criteria:structuredClone(objective.criteria),...(objective.prerequisiteIds.length?{prerequisites:objective.prerequisiteIds.map(id=>({id,title:all.find(row=>row.id===id)!.title}))}:{})};assertLessonObjective(snapshot);return snapshot;
}
