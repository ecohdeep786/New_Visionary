import {assertLessonObjective} from '../services/lessonObjective.ts';

const record=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
const text=value=>typeof value==='string'&&Boolean(value.trim())&&value.length<=2000;
const only=(value,fields)=>Object.keys(value).every(key=>fields.includes(key));
export const curriculumPublicationRevision=value=>JSON.stringify(value===undefined?[]:value);

/** A learner-safe, immutable class copy. Editorial notes and practice keys never belong here. */
export function assertCurriculumPublications(value){
 const fail=()=>{throw Error('Published curriculum could not be read safely. Original copies are retained.');};
 if(!Array.isArray(value)||value.length>100)return fail();
 const ids=new Set(),deliveries=new Set();
 for(const row of value){
  if(!record(row)||!only(row,['id','deliveryId','resourceId','revision','title','language','source','publishedAt','chapters','status','stateHistory'])||!text(row.id)||ids.has(row.id)||!text(row.deliveryId)||deliveries.has(row.deliveryId)||!text(row.resourceId)||!Number.isInteger(row.revision)||row.revision<1||!text(row.title)||!text(row.source)||!['en','hi','bn'].includes(row.language)||typeof row.publishedAt!=='string'||!Number.isFinite(Date.parse(row.publishedAt))||!Array.isArray(row.chapters)||!row.chapters.length||row.chapters.length>30||!['published','withdrawn'].includes(row.status)||!Array.isArray(row.stateHistory)||row.stateHistory.length>100)return fail();
  let state='published';for(const event of row.stateHistory){if(!record(event)||!only(event,['from','to','at','actor'])||event.from!==state||!['published','withdrawn'].includes(event.to)||event.to===state||!text(event.actor)||typeof event.at!=='string'||!Number.isFinite(Date.parse(event.at)))return fail();state=event.to;}if(state!==row.status)return fail();
  ids.add(row.id);deliveries.add(row.deliveryId);const chapterIds=new Set(),objectives=new Map();let sourceIdentity;
  for(const [position,chapter] of row.chapters.entries()){
   if(!record(chapter)||!only(chapter,['id','title','sourceSection','objectives'])||!text(chapter.id)||chapterIds.has(chapter.id)||!text(chapter.title)||!text(chapter.sourceSection)||!Array.isArray(chapter.objectives)||!chapter.objectives.length||chapter.objectives.length>30)return fail();
   chapterIds.add(chapter.id);
   for(const [index,objective] of chapter.objectives.entries()){
    try{assertLessonObjective(objective);}catch{return fail();}
    if(!only(objective,['conceptId','title','status','locale','selection','provenance','sourceChapter','objectivePosition','explanation','representations','criteria','prerequisites'])||objective.status!=='reviewed'||objective.locale!==row.language||!Array.isArray(objective.criteria)||!objective.criteria.length||objectives.has(objective.conceptId)||objective.sourceChapter?.id!==chapter.id||objective.sourceChapter.title!==chapter.title||objective.sourceChapter.sourceSection!==chapter.sourceSection||objective.sourceChapter.position!==position||objective.objectivePosition!==index)return fail();
    const identity=JSON.stringify([objective.selection,objective.provenance.provider,objective.provenance.version]);if(sourceIdentity&&identity!==sourceIdentity)return fail();sourceIdentity=identity;
    objectives.set(objective.conceptId,objective);
   }
  }

  if(objectives.size>200)return fail();
  const visiting=new Set(),done=new Set();
  function visit(id){if(visiting.has(id))return fail();if(done.has(id))return;visiting.add(id);for(const prerequisite of objectives.get(id).prerequisites||[]){if(!objectives.has(prerequisite.id)||objectives.get(prerequisite.id).title!==prerequisite.title)return fail();visit(prerequisite.id);}visiting.delete(id);done.add(id);}
  for(const id of objectives.keys())visit(id);
 }
}

/** Only append a fixed copy or change one copy's availability with an appended audit event. */
export function validCurriculumPublicationUpdate(previous,next){
 assertCurriculumPublications(previous);assertCurriculumPublications(next);
 if(next.length===previous.length+1)return previous.every((row,index)=>JSON.stringify(row)===JSON.stringify(next[index]));
 if(next.length!==previous.length)return false;
 let changed=0;
 for(const [index,row] of previous.entries()){
  const other=next[index];if(JSON.stringify(row)===JSON.stringify(other))continue;
  const {status,stateHistory,...content}=row;const {status:nextStatus,stateHistory:nextHistory,...nextContent}=other;
  if(JSON.stringify(content)!==JSON.stringify(nextContent)||status===nextStatus||nextHistory.length!==stateHistory.length+1||!stateHistory.every((event,i)=>JSON.stringify(event)===JSON.stringify(nextHistory[i])))return false;changed++;
 }
 return changed===1;
}

/** Compare the delivered source independently of teacher inbox projection metadata. */
export function deliveredCurriculumRevision(delivery){
 const {organizationEmail:ignoredOrganization,importedResourceId:ignoredImport,...source}=delivery;
 return JSON.stringify(source);
}
